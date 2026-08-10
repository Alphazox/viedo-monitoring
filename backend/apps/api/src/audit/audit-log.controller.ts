import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { paginate, PERMISSIONS, RequirePermissions } from '@video-analytics/common';
import { PrismaService } from '@video-analytics/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_LOGS_READ)
  async findAll(@Query() query: AuditLogQueryDto, @CurrentUser() currentUser: JwtPayload) {
    const { page, limit, action, resource, actorId } = query;

    // Always scoped to the caller's own organization — cross-tenant audit
    // visibility (Platform Owner support tooling) is FR-ORG-05, deferred.
    const where = {
      organizationId: currentUser.organizationId,
      ...(action && { action }),
      ...(resource && { resource }),
      ...(actorId && { actorId }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }
}
