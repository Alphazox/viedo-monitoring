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
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';

@ApiTags('buildings')
@ApiBearerAuth()
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BUILDINGS_CREATE)
  create(@Body() dto: CreateBuildingDto) {
    return this.buildingsService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BUILDINGS_READ)
  findAll() {
    return this.buildingsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.BUILDINGS_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.buildingsService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BUILDINGS_UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBuildingDto) {
    return this.buildingsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.BUILDINGS_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.buildingsService.remove(id);
  }
}
