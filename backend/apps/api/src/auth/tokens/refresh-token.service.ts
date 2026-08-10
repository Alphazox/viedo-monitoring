import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@video-analytics/database';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { RequestContext } from '../utils/request-context';

interface IssuedToken {
  token: string;
  familyId: string;
  expiresAt: Date;
}

interface RotatedToken extends IssuedToken {
  userId: string;
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async issue(
    userId: string,
    context: RequestContext,
    familyId: string = randomUUID(),
  ): Promise<IssuedToken> {
    const token = randomBytes(64).toString('hex');
    const tokenHash = this.hash(token);
    const expiresInDays = this.config.get<number>('JWT_REFRESH_EXPIRES_IN_DAYS', 7);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt,
        createdByIp: context.ip,
        userAgent: context.userAgent,
      },
    });

    return { token, familyId, expiresAt };
  }

  async rotate(rawToken: string, context: RequestContext): Promise<RotatedToken> {
    const tokenHash = this.hash(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt || existing.expiresAt < new Date()) {
      // A revoked or expired token being presented again indicates possible
      // theft — kill every token in the family to force re-authentication.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: existing.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const next = await this.issue(existing.userId, context, existing.familyId);

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedByHash: this.hash(next.token) },
    });

    return { userId: existing.userId, ...next };
  }

  async revoke(rawToken: string): Promise<void> {
    const tokenHash = this.hash(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
