import { Injectable, NotFoundException } from '@nestjs/common';
import { Floor, TenantContext, TenantPrismaService } from '@video-analytics/database';
import type { CreateFloorDto } from './dto/create-floor.dto';
import type { UpdateFloorDto } from './dto/update-floor.dto';

@Injectable()
export class FloorsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(dto: CreateFloorDto): Promise<Floor> {
    const building = await this.tenantPrisma.client.building.findUnique({
      where: { id: dto.buildingId },
    });
    if (!building) {
      throw new NotFoundException('Building not found');
    }

    return this.tenantPrisma.client.floor.create({
      data: {
        organizationId: TenantContext.requireOrganizationId(),
        buildingId: dto.buildingId,
        name: dto.name,
        level: dto.level,
      },
    });
  }

  async findAll(): Promise<Floor[]> {
    return this.tenantPrisma.client.floor.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<Floor> {
    const floor = await this.tenantPrisma.client.floor.findUnique({ where: { id } });
    if (!floor) {
      throw new NotFoundException('Floor not found');
    }
    return floor;
  }

  async update(id: string, dto: UpdateFloorDto): Promise<Floor> {
    await this.findById(id);
    return this.tenantPrisma.client.floor.update({
      where: { id },
      data: { name: dto.name, level: dto.level },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantPrisma.client.floor.delete({ where: { id } });
  }
}
