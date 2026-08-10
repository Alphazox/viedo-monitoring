import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantContext, TenantPrismaService, Zone } from '@video-analytics/database';
import type { CreateZoneDto } from './dto/create-zone.dto';
import type { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(dto: CreateZoneDto): Promise<Zone> {
    const floor = await this.tenantPrisma.client.floor.findUnique({ where: { id: dto.floorId } });
    if (!floor) {
      throw new NotFoundException('Floor not found');
    }

    return this.tenantPrisma.client.zone.create({
      data: {
        organizationId: TenantContext.requireOrganizationId(),
        floorId: dto.floorId,
        name: dto.name,
      },
    });
  }

  async findAll(): Promise<Zone[]> {
    return this.tenantPrisma.client.zone.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<Zone> {
    const zone = await this.tenantPrisma.client.zone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException('Zone not found');
    }
    return zone;
  }

  async update(id: string, dto: UpdateZoneDto): Promise<Zone> {
    await this.findById(id);
    return this.tenantPrisma.client.zone.update({ where: { id }, data: { name: dto.name } });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantPrisma.client.zone.delete({ where: { id } });
  }
}
