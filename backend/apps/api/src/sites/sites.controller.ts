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
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SitesService } from './sites.service';

@ApiTags('sites')
@ApiBearerAuth()
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.SITES_CREATE)
  create(@Body() dto: CreateSiteDto) {
    return this.sitesService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SITES_READ)
  findAll() {
    return this.sitesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.SITES_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SITES_UPDATE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSiteDto) {
    return this.sitesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.SITES_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.sitesService.remove(id);
  }
}
