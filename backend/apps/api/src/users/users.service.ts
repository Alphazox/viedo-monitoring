import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hashPassword, Paginated, paginate, PaginationQueryDto } from '@video-analytics/common';
import { PrismaService, TenantContext, TenantPrismaService } from '@video-analytics/database';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { toPublicUser, type PublicUser } from './users.mapper';
import {
  userWithRoleNamesInclude,
  userWithRolesInclude,
  type UserWithRoleNames,
  type UserWithRoles,
} from './users.types';

@Injectable()
export class UsersService {
  constructor(
    /** Unscoped — used only where no tenant context exists yet, see the two methods below. */
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Deliberately bypasses tenant scoping: at login time no tenant context
   * exists yet (discovering the caller's organization is the point of this
   * lookup). Safe because email is globally unique, so this can only ever
   * match zero or one row system-wide — it cannot leak a list of another
   * tenant's data the way an unscoped list/filter query could.
   */
  async findByEmailWithRoles(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({ where: { email }, include: userWithRolesInclude });
  }

  /**
   * Deliberately bypasses tenant scoping: called from the refresh-token flow,
   * which runs on the @Public() /v1/auth/refresh route — there is no JWT and
   * therefore no tenant context on that request. Safe because `id` here is
   * never client-supplied; it comes from RefreshToken.userId, a server-side
   * value already tied to one specific, already-authenticated user by the
   * token rotation logic in RefreshTokenService.
   */
  async findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({ where: { id }, include: userWithRolesInclude });
  }

  /** Unscoped for the same reason as findByIdWithRoles — called from the @Public() login route. */
  async markLoggedIn(id: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    // Unscoped: email is unique platform-wide (see LLD §3.3), not per-tenant,
    // so this check must see every organization's users, not just the
    // caller's — otherwise a collision with another tenant's email would
    // fall through to a raw database unique-constraint error instead of a
    // clean 409.
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const saltRounds = this.config.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const passwordHash = await hashPassword(dto.password, saltRounds);

    const user = await this.tenantPrisma.client.user.create({
      data: {
        organizationId: TenantContext.requireOrganizationId(),
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roles: dto.roleIds ? { create: dto.roleIds.map((roleId) => ({ roleId })) } : undefined,
      },
      include: userWithRoleNamesInclude,
    });

    return toPublicUser(user);
  }

  async findAll(pagination: PaginationQueryDto): Promise<Paginated<PublicUser>> {
    const { page, limit } = pagination;
    const [items, total] = await this.tenantPrisma.client.$transaction([
      this.tenantPrisma.client.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: userWithRoleNamesInclude,
      }),
      this.tenantPrisma.client.user.count(),
    ]);

    return paginate(items.map(toPublicUser), total, page, limit);
  }

  async findById(id: string): Promise<UserWithRoleNames> {
    const user = await this.tenantPrisma.client.user.findUnique({
      where: { id },
      include: userWithRoleNamesInclude,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    await this.findById(id);

    const user = await this.tenantPrisma.client.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        ...(dto.roleIds && {
          roles: {
            deleteMany: {},
            create: dto.roleIds.map((roleId) => ({ roleId })),
          },
        }),
      },
      include: userWithRoleNamesInclude,
    });

    return toPublicUser(user);
  }

  async deactivate(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantPrisma.client.user.update({ where: { id }, data: { isActive: false } });
  }
}
