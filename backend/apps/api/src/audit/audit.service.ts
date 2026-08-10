import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@video-analytics/database';

export interface AuditEntry {
  /** Explicit, not read from TenantContext — some audit events (e.g. a failed
   * login) happen before any tenant context exists on the request. Callers
   * that know the organization (because they already looked up the account)
   * pass it directly; callers operating inside an authenticated request can
   * pass TenantContext.getOrganizationId(). */
  organizationId?: string;
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorId: entry.actorId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }
}
