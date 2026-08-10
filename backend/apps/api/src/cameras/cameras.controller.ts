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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, RequirePermissions } from '@video-analytics/common';
import { CamerasService } from './cameras.service';
import { toPublicCamera } from './cameras.mapper';
import { CreateCameraDto } from './dto/create-camera.dto';
import { ListCamerasQueryDto } from './dto/list-cameras-query.dto';
import { TestConnectionDto } from './dto/test-connection.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { OnvifDiscoveryService } from './onvif-discovery.service';

@ApiTags('cameras')
@ApiBearerAuth()
@Controller('cameras')
export class CamerasController {
  constructor(
    private readonly camerasService: CamerasService,
    private readonly onvifDiscovery: OnvifDiscoveryService,
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.CAMERAS_CREATE)
  create(@Body() dto: CreateCameraDto) {
    return this.camerasService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CAMERAS_READ)
  findAll(@Query() query: ListCamerasQueryDto) {
    return this.camerasService.findAll(query);
  }

  @Post('test-connection')
  @RequirePermissions(PERMISSIONS.CAMERAS_TEST_CONNECTION)
  testConnectionPreSave(@Body() dto: TestConnectionDto) {
    return this.camerasService.testConnectionPreSave(dto);
  }

  @Post('discover')
  @RequirePermissions(PERMISSIONS.CAMERAS_DISCOVER)
  discover() {
    return this.onvifDiscovery.discover();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CAMERAS_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return toPublicCamera(await this.camerasService.findById(id));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CAMERAS_UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCameraDto) {
    return this.camerasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.CAMERAS_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.camerasService.remove(id);
  }

  @Post(':id/test-connection')
  @RequirePermissions(PERMISSIONS.CAMERAS_TEST_CONNECTION)
  testConnectionSaved(@Param('id', ParseUUIDPipe) id: string) {
    return this.camerasService.testConnectionSaved(id);
  }
}
