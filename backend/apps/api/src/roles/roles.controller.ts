import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, RequirePermissions } from '@video-analytics/common';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_CREATE)
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Patch(':id/permissions')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  assignPermissions(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignPermissionsDto) {
    return this.rolesService.assignPermissions(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.ROLES_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.rolesService.remove(id);
  }
}
