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
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { FloorsService } from './floors.service';

@ApiTags('floors')
@ApiBearerAuth()
@Controller('floors')
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.FLOORS_CREATE)
  create(@Body() dto: CreateFloorDto) {
    return this.floorsService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.FLOORS_READ)
  findAll() {
    return this.floorsService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.FLOORS_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.floorsService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.FLOORS_UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFloorDto) {
    return this.floorsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.FLOORS_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.floorsService.remove(id);
  }
}
