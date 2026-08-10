import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PrismaService,
  TenantContext,
  TenantPrismaService,
} from '@video-analytics/database';
import type { AssignPermissionsDto } from './dto/assign-permissions.dto';
import type { CreateRoleDto } from './dto/create-role.dto';
import type { UpdateRoleDto } from './dto/update-role.dto';

const roleWithPermissionsInclude = {
  permissions: { include: { permission: true } },
} satisfies Prisma.RoleInclude;

type RoleWithPermissions = Prisma.RoleGetPayload<{ include: typeof roleWithPermissionsInclude }>;

@Injectable()
export class RolesService {
  constructor(
    /** Unscoped — Permission is a global catalog, RolePermission is a join table scoped transitively via Role. */
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async create(dto: CreateRoleDto): Promise<RoleWithPermissions> {
    const organizationId = TenantContext.requireOrganizationId();

    const existing = await this.tenantPrisma.client.role.findUnique({
      where: { organizationId_name: { organizationId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException('A role with this name already exists');
    }

    const permissions = await this.resolvePermissions(dto.permissionKeys ?? []);

    return this.tenantPrisma.client.role.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) },
      },
      include: roleWithPermissionsInclude,
    });
  }

  async findAll(): Promise<RoleWithPermissions[]> {
    return this.tenantPrisma.client.role.findMany({
      include: roleWithPermissionsInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<RoleWithPermissions> {
    const role = await this.tenantPrisma.client.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude,
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleWithPermissions> {
    await this.findById(id);

    await this.tenantPrisma.client.role.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });

    return this.findById(id);
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto): Promise<RoleWithPermissions> {
    // Ownership check first: findById is tenant-scoped, so this throws
    // NotFoundException for another tenant's role id before we ever touch
    // the (non-tenant-scoped) join table below.
    await this.findById(id);
    const permissions = await this.resolvePermissions(dto.permissionKeys);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: id, permissionId: permission.id })),
      }),
    ]);

    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findById(id);
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    await this.tenantPrisma.client.role.delete({ where: { id } });
  }

  private async resolvePermissions(keys: string[]) {
    if (keys.length === 0) {
      return [];
    }

    const permissions = await this.prisma.permission.findMany({ where: { key: { in: keys } } });
    const missing = keys.filter((key) => !permissions.some((permission) => permission.key === key));

    if (missing.length > 0) {
      throw new BadRequestException(`Unknown permission keys: ${missing.join(', ')}`);
    }

    return permissions;
  }
}
