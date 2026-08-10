import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, RequirePermissions } from '@video-analytics/common';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @RequirePermissions(PERMISSIONS.ORGANIZATIONS_READ)
  findMine() {
    return this.organizationsService.findMine();
  }

  @Patch('me')
  @RequirePermissions(PERMISSIONS.ORGANIZATIONS_UPDATE)
  updateMine(@Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.updateMine(dto);
  }
}
