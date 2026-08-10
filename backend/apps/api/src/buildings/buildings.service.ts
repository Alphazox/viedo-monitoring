import { Injectable, NotFoundException } from '@nestjs/common';
import { Building, TenantContext, TenantPrismaService } from '@video-analytics/database';
import type { CreateBuildingDto } from './dto/create-building.dto';
import type { UpdateBuildingDto } from './dto/update-building.dto';

@Injectable()
export class BuildingsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(dto: CreateBuildingDto): Promise<Building> {
    // Tenant-scoped lookup: a siteId belonging to another organization
    // simply won't be found here, surfacing as 404 rather than a silent
    // cross-tenant write.
    const site = await this.tenantPrisma.client.site.findUnique({ where: { id: dto.siteId } });
    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return this.tenantPrisma.client.building.create({
      data: {
        organizationId: TenantContext.requireOrganizationId(),
        siteId: dto.siteId,
        name: dto.name,
      },
    });
  }

  async findAll(): Promise<Building[]> {
    return this.tenantPrisma.client.building.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<Building> {
    const building = await this.tenantPrisma.client.building.findUnique({ where: { id } });
    if (!building) {
      throw new NotFoundException('Building not found');
    }
    return building;
  }

  async update(id: string, dto: UpdateBuildingDto): Promise<Building> {
    await this.findById(id);
    return this.tenantPrisma.client.building.update({ where: { id }, data: { name: dto.name } });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantPrisma.client.building.delete({ where: { id } });
  }
}
