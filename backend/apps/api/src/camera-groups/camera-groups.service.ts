import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CameraGroup, TenantContext, TenantPrismaService } from '@video-analytics/database';
import type { CreateCameraGroupDto } from './dto/create-camera-group.dto';
import type { UpdateCameraGroupDto } from './dto/update-camera-group.dto';

@Injectable()
export class CameraGroupsService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(dto: CreateCameraGroupDto): Promise<CameraGroup> {
    return this.tenantPrisma.client.cameraGroup.create({
      data: {
        organizationId: TenantContext.requireOrganizationId(),
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async findAll(): Promise<CameraGroup[]> {
    return this.tenantPrisma.client.cameraGroup.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<CameraGroup> {
    const group = await this.tenantPrisma.client.cameraGroup.findUnique({ where: { id } });
    if (!group) {
      throw new NotFoundException('Camera group not found');
    }
    return group;
  }

  async update(id: string, dto: UpdateCameraGroupDto): Promise<CameraGroup> {
    await this.findById(id);
    return this.tenantPrisma.client.cameraGroup.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantPrisma.client.cameraGroup.delete({ where: { id } });
  }

  async addCamera(groupId: string, cameraId: string): Promise<void> {
    await this.findById(groupId);
    await this.requireCameraInTenant(cameraId);

    const existing = await this.tenantPrisma.client.cameraGroupMembership.findUnique({
      where: { cameraId_groupId: { cameraId, groupId } },
    });
    if (existing) {
      throw new ConflictException('Camera is already a member of this group');
    }

    await this.tenantPrisma.client.cameraGroupMembership.create({ data: { cameraId, groupId } });
  }

  async removeCamera(groupId: string, cameraId: string): Promise<void> {
    await this.findById(groupId);
    await this.requireCameraInTenant(cameraId);
    await this.tenantPrisma.client.cameraGroupMembership.deleteMany({
      where: { cameraId, groupId },
    });
  }

  private async requireCameraInTenant(cameraId: string): Promise<void> {
    const camera = await this.tenantPrisma.client.camera.findUnique({ where: { id: cameraId } });
    if (!camera) {
      throw new NotFoundException('Camera not found');
    }
  }
}
