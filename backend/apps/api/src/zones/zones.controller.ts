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
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZonesService } from './zones.service';

@ApiTags('zones')
@ApiBearerAuth()
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ZONES_CREATE)
  create(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ZONES_READ)
  findAll() {
    return this.zonesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ZONES_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ZONES_UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateZoneDto) {
    return this.zonesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.ZONES_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.zonesService.remove(id);
  }
}
