import { Injectable, NotFoundException } from '@nestjs/common';
import { Site, TenantContext, TenantPrismaService } from '@video-analytics/database';
import type { CreateSiteDto } from './dto/create-site.dto';
import type { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(dto: CreateSiteDto): Promise<Site> {
    return this.tenantPrisma.client.site.create({
      data: {
        organizationId: TenantContext.requireOrganizationId(),
        name: dto.name,
        timezone: dto.timezone,
        address: dto.address,
      },
    });
  }

  async findAll(): Promise<Site[]> {
    return this.tenantPrisma.client.site.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<Site> {
    const site = await this.tenantPrisma.client.site.findUnique({ where: { id } });
    if (!site) {
      throw new NotFoundException('Site not found');
    }
    return site;
  }

  async update(id: string, dto: UpdateSiteDto): Promise<Site> {
    await this.findById(id);
    return this.tenantPrisma.client.site.update({
      where: { id },
      data: { name: dto.name, timezone: dto.timezone, address: dto.address },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantPrisma.client.site.delete({ where: { id } });
  }
}
