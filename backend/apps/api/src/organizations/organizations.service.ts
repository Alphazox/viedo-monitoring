import { Injectable, NotFoundException } from '@nestjs/common';
import { Organization, PrismaService, TenantContext } from '@video-analytics/database';
import type { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(): Promise<Organization> {
    const organizationId = TenantContext.requireOrganizationId();
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async updateMine(dto: UpdateOrganizationDto): Promise<Organization> {
    const organizationId = TenantContext.requireOrganizationId();
    await this.findMine();
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { name: dto.name },
    });
  }
}
