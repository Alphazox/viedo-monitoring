import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '@video-analytics/common';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { extractPermissions, extractRoleNames, type UserWithRoles } from '../users/users.types';
import type { LoginDto } from './dto/login.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenService } from './tokens/refresh-token.service';
import type { JwtPayload } from './types/jwt-payload.type';
import type { RequestContext } from './utils/request-context';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, context: RequestContext): Promise<AuthTokens> {
    const user = await this.usersService.findByEmailWithRoles(dto.email);
    const passwordValid = user ? await verifyPassword(user.passwordHash, dto.password) : false;

    if (!user || !user.isActive || !passwordValid) {
      await this.auditService.record({
        organizationId: user?.organizationId,
        actorId: user?.id,
        action: 'auth.login_failed',
        resource: 'user',
        resourceId: user?.id,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.markLoggedIn(user.id);
    const tokens = await this.issueTokens(user, context);

    await this.auditService.record({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'auth.login_succeeded',
      resource: 'user',
      resourceId: user.id,
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });

    return tokens;
  }

  async refresh(dto: RefreshTokenDto, context: RequestContext): Promise<AuthTokens> {
    const rotated = await this.refreshTokens.rotate(dto.refreshToken, context);
    const user = await this.usersService.findByIdWithRoles(rotated.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is no longer active');
    }

    const accessToken = await this.signAccessToken(user);

    await this.auditService.record({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'auth.token_refreshed',
      resource: 'user',
      resourceId: user.id,
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });

    return {
      accessToken,
      refreshToken: rotated.token,
      refreshTokenExpiresAt: rotated.expiresAt,
    };
  }

  async logout(dto: RefreshTokenDto, currentUser: JwtPayload): Promise<void> {
    await this.refreshTokens.revoke(dto.refreshToken);
    await this.auditService.record({
      organizationId: currentUser.organizationId,
      actorId: currentUser.sub,
      action: 'auth.logout',
      resource: 'user',
      resourceId: currentUser.sub,
    });
  }

  private async issueTokens(user: UserWithRoles, context: RequestContext): Promise<AuthTokens> {
    const accessToken = await this.signAccessToken(user);
    const refresh = await this.refreshTokens.issue(user.id, context);

    return {
      accessToken,
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt,
    };
  }

  private async signAccessToken(user: UserWithRoles): Promise<string> {
    if (!user.organizationId) {
      // Transitional guard: only reachable before the Phase 3 backfill has
      // run (see docs/LLD/phase-3-multi-tenancy-foundation.md §6). Once
      // organizationId is NOT NULL at the schema level this branch is dead
      // code, kept as a safety net rather than trusted to never happen.
      throw new UnauthorizedException('Account is not assigned to an organization');
    }

    const payload: JwtPayload = {
      sub: user.id,
      organizationId: user.organizationId,
      email: user.email,
      roles: extractRoleNames(user),
      permissions: extractPermissions(user),
    };
    return this.jwtService.signAsync(payload);
  }
}
