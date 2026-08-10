import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decrypt, encrypt, Paginated, paginate } from '@video-analytics/common';
import {
  Camera,
  CameraSourceType,
  CameraStatus,
  TenantContext,
  TenantPrismaService,
} from '@video-analytics/database';
import {
  CameraConnectionCheckService,
  ConnectionCheckResult,
} from './camera-connection-check.service';
import { toPublicCamera, type PublicCamera } from './cameras.mapper';
import type { CreateCameraDto } from './dto/create-camera.dto';
import type { ListCamerasQueryDto } from './dto/list-cameras-query.dto';
import type { TestConnectionDto } from './dto/test-connection.dto';
import type { UpdateCameraDto } from './dto/update-camera.dto';
import { extractRtspCredentials, injectRtspCredentials } from './utils/rtsp-url.util';

const CONNECTION_CHECKABLE_SOURCE_TYPES: CameraSourceType[] = [
  CameraSourceType.RTSP,
  CameraSourceType.ONVIF,
];

interface ParsedConnectionInput {
  url?: string;
  username?: string;
  password?: string;
}

@Injectable()
export class CamerasService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly connectionCheck: CameraConnectionCheckService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateCameraDto): Promise<PublicCamera> {
    if (dto.zoneId) {
      await this.requireZoneInTenant(dto.zoneId);
    }

    const parsed = this.parseConnectionInput(dto.rtspUrl, dto.rtspUsername, dto.rtspPassword);

    const camera = await this.tenantPrisma.client.camera.create({
      data: {
        organizationId: TenantContext.requireOrganizationId(),
        name: dto.name,
        sourceType: dto.sourceType ?? CameraSourceType.RTSP,
        zoneId: dto.zoneId,
        rtspUrl: parsed.url,
        rtspUsername: parsed.username,
        rtspPasswordEnc: parsed.password ? this.encryptPassword(parsed.password) : undefined,
        usbDevicePath: dto.usbDevicePath,
        fileSourceUri: dto.fileSourceUri,
        recordingMode: dto.recordingMode,
        retentionDaysOverride: dto.retentionDaysOverride,
      },
    });

    // Soft-validate (LLD §4, confirmed): a failed reachability check never
    // blocks the write — cameras are routinely registered before they're
    // physically powered on. It only seeds the health fields.
    const checked = await this.runConnectionCheckIfApplicable(camera);
    return toPublicCamera(checked);
  }

  async findAll(query: ListCamerasQueryDto): Promise<Paginated<PublicCamera>> {
    const { page, limit, zoneId, siteId, groupId, status, sourceType } = query;
    const where = {
      ...(zoneId && { zoneId }),
      ...(siteId && { zone: { floor: { building: { siteId } } } }),
      ...(groupId && { groups: { some: { groupId } } }),
      ...(status && { status }),
      ...(sourceType && { sourceType }),
    };

    const [items, total] = await this.tenantPrisma.client.$transaction([
      this.tenantPrisma.client.camera.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.tenantPrisma.client.camera.count({ where }),
    ]);

    return paginate(items.map(toPublicCamera), total, page, limit);
  }

  async findById(id: string): Promise<Camera> {
    const camera = await this.tenantPrisma.client.camera.findUnique({ where: { id } });
    if (!camera) {
      throw new NotFoundException('Camera not found');
    }
    return camera;
  }

  async update(id: string, dto: UpdateCameraDto): Promise<PublicCamera> {
    const existing = await this.findById(id);

    if (dto.zoneId) {
      await this.requireZoneInTenant(dto.zoneId);
    }

    const connectionFieldsChanged =
      dto.rtspUrl !== undefined || dto.rtspUsername !== undefined || dto.rtspPassword !== undefined;

    const parsed = connectionFieldsChanged
      ? this.parseConnectionInput(
          dto.rtspUrl ?? existing.rtspUrl ?? undefined,
          dto.rtspUsername ?? existing.rtspUsername ?? undefined,
          dto.rtspPassword,
        )
      : undefined;

    const camera = await this.tenantPrisma.client.camera.update({
      where: { id },
      data: {
        name: dto.name,
        sourceType: dto.sourceType,
        zoneId: dto.zoneId,
        ...(parsed && {
          rtspUrl: parsed.url,
          rtspUsername: parsed.username,
          // Only overwritten when the caller actually sent a new password —
          // omitting rtspPassword on an otherwise-connection-changing update
          // (e.g. just editing rtspUsername) must not wipe the stored one.
          ...(dto.rtspPassword !== undefined && {
            rtspPasswordEnc: parsed.password ? this.encryptPassword(parsed.password) : null,
          }),
        }),
        usbDevicePath: dto.usbDevicePath,
        fileSourceUri: dto.fileSourceUri,
        recordingMode: dto.recordingMode,
        retentionDaysOverride: dto.retentionDaysOverride,
        isActive: dto.isActive,
      },
    });

    const result = connectionFieldsChanged
      ? await this.runConnectionCheckIfApplicable(camera)
      : camera;
    return toPublicCamera(result);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantPrisma.client.camera.delete({ where: { id } });
  }

  /** Pre-save check, no persistence — for a "Test Connection" button before a camera row exists. */
  async testConnectionPreSave(dto: TestConnectionDto): Promise<ConnectionCheckResult> {
    const parsed = this.parseConnectionInput(dto.rtspUrl, dto.rtspUsername, dto.rtspPassword);
    const url = injectRtspCredentials(parsed.url ?? dto.rtspUrl, parsed.username, parsed.password);
    return this.connectionCheck.check(url);
  }

  /** Re-runs the check against a saved camera and persists the result. */
  async testConnectionSaved(id: string): Promise<PublicCamera> {
    const camera = await this.findById(id);
    if (!CONNECTION_CHECKABLE_SOURCE_TYPES.includes(camera.sourceType) || !camera.rtspUrl) {
      throw new BadRequestException(
        'Connection check only applies to RTSP/ONVIF cameras with a stream URL',
      );
    }
    const checked = await this.runConnectionCheckIfApplicable(camera);
    return toPublicCamera(checked);
  }

  private async requireZoneInTenant(zoneId: string): Promise<void> {
    const zone = await this.tenantPrisma.client.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundException('Zone not found');
    }
  }

  /**
   * Extracts userinfo out of a client-supplied URL (if present) so the
   * plaintext rtspUrl column never contains a credential, even transiently.
   * Standalone rtspUsername/rtspPassword fields are used as a fallback when
   * the URL itself carries none.
   */
  private parseConnectionInput(
    rawUrl: string | undefined,
    username?: string,
    password?: string,
  ): ParsedConnectionInput {
    if (!rawUrl) {
      return { url: undefined, username, password };
    }

    let extracted;
    try {
      extracted = extractRtspCredentials(rawUrl);
    } catch {
      throw new BadRequestException('rtspUrl is not a valid URL');
    }

    return {
      url: extracted.url,
      username: extracted.username ?? username,
      password: extracted.password ?? password,
    };
  }

  private encryptPassword(plain: string): string {
    return encrypt(plain, this.config.getOrThrow<string>('CAMERA_CREDENTIALS_ENCRYPTION_KEY'));
  }

  private decryptPassword(ciphertext: string): string {
    return decrypt(ciphertext, this.config.getOrThrow<string>('CAMERA_CREDENTIALS_ENCRYPTION_KEY'));
  }

  /** Only RTSP/ONVIF cameras with a URL are checkable; others are left untouched at status UNKNOWN. */
  private async runConnectionCheckIfApplicable(camera: Camera): Promise<Camera> {
    if (!CONNECTION_CHECKABLE_SOURCE_TYPES.includes(camera.sourceType) || !camera.rtspUrl) {
      return camera;
    }

    const password = camera.rtspPasswordEnc
      ? this.decryptPassword(camera.rtspPasswordEnc)
      : undefined;
    const url = injectRtspCredentials(camera.rtspUrl, camera.rtspUsername ?? undefined, password);
    const result = await this.connectionCheck.check(url);

    return this.tenantPrisma.client.camera.update({
      where: { id: camera.id },
      data: {
        status: result.success ? CameraStatus.ONLINE : CameraStatus.OFFLINE,
        lastCheckedAt: new Date(),
        lastError: result.error ?? null,
        streamErrorCount: result.success ? 0 : { increment: 1 },
      },
    });
  }
}
