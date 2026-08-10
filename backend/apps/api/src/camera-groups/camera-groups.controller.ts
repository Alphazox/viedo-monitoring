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
import { CameraGroupsService } from './camera-groups.service';
import { CreateCameraGroupDto } from './dto/create-camera-group.dto';
import { UpdateCameraGroupDto } from './dto/update-camera-group.dto';

@ApiTags('camera-groups')
@ApiBearerAuth()
@Controller('camera-groups')
export class CameraGroupsController {
  constructor(private readonly cameraGroupsService: CameraGroupsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.CAMERA_GROUPS_CREATE)
  create(@Body() dto: CreateCameraGroupDto) {
    return this.cameraGroupsService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CAMERA_GROUPS_READ)
  findAll() {
    return this.cameraGroupsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CAMERA_GROUPS_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cameraGroupsService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CAMERA_GROUPS_UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCameraGroupDto) {
    return this.cameraGroupsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.CAMERA_GROUPS_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.cameraGroupsService.remove(id);
  }

  @Post(':id/cameras/:cameraId')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.CAMERA_GROUPS_UPDATE)
  async addCamera(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('cameraId', ParseUUIDPipe) cameraId: string,
  ): Promise<void> {
    await this.cameraGroupsService.addCamera(id, cameraId);
  }

  @Delete(':id/cameras/:cameraId')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.CAMERA_GROUPS_UPDATE)
  async removeCamera(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('cameraId', ParseUUIDPipe) cameraId: string,
  ): Promise<void> {
    await this.cameraGroupsService.removeCamera(id, cameraId);
  }
}
