import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSION_DEFINITIONS, PERMISSIONS, RequirePermissions } from '@video-analytics/common';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  /** The full catalog is a compile-time constant — no DB round-trip needed, always in sync by definition. */
  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  findAll() {
    return PERMISSION_DEFINITIONS;
  }
}
