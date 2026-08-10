import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { CameraSourceType, CameraStatus, TenantContext } from '@video-analytics/database';
import type { CameraConnectionCheckService } from './camera-connection-check.service';
import { CamerasService } from './cameras.service';

const ORG_ID = 'org-1';
const ENCRYPTION_KEY = Buffer.alloc(32, 3).toString('base64');

function buildService(overrides?: {
  connectionCheckResult?: { success: boolean; error?: string };
}) {
  const zoneFindUnique = jest.fn();
  const cameraCreate = jest.fn();
  const cameraUpdate = jest.fn();

  const tenantPrisma = {
    client: {
      zone: { findUnique: zoneFindUnique },
      camera: {
        create: cameraCreate,
        update: cameraUpdate,
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    },
  };

  const connectionCheck = {
    check: jest.fn().mockResolvedValue(overrides?.connectionCheckResult ?? { success: true }),
  } as unknown as CameraConnectionCheckService;

  const config = {
    getOrThrow: jest.fn().mockReturnValue(ENCRYPTION_KEY),
  } as unknown as ConfigService;

  const service = new CamerasService(tenantPrisma as any, connectionCheck, config);

  return { service, zoneFindUnique, cameraCreate, cameraUpdate, connectionCheck };
}

function baseCameraRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'camera-1',
    organizationId: ORG_ID,
    zoneId: null,
    name: 'Lobby',
    sourceType: CameraSourceType.RTSP,
    rtspUrl: 'rtsp://192.168.1.50:554/stream1',
    rtspUsername: null,
    rtspPasswordEnc: null,
    usbDevicePath: null,
    fileSourceUri: null,
    onvifDeviceInfo: null,
    ptzCapable: false,
    status: CameraStatus.UNKNOWN,
    lastCheckedAt: null,
    lastFrameAt: null,
    streamErrorCount: 0,
    lastError: null,
    recordingMode: 'EVENT_ONLY',
    retentionDaysOverride: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CamerasService', () => {
  describe('create', () => {
    it('rejects a zoneId that does not resolve within the caller tenant', async () => {
      const { service, zoneFindUnique } = buildService();
      zoneFindUnique.mockResolvedValue(null);

      await TenantContext.run(ORG_ID, async () => {
        await expect(
          service.create({ name: 'Lobby', zoneId: 'zone-from-another-org' } as any),
        ).rejects.toThrow(NotFoundException);
      });
    });

    it('soft-validates: persists the camera even when the connection check fails', async () => {
      const { service, cameraCreate, cameraUpdate } = buildService({
        connectionCheckResult: { success: false, error: 'Connection refused' },
      });
      cameraCreate.mockResolvedValue(baseCameraRow());
      cameraUpdate.mockResolvedValue(
        baseCameraRow({ status: CameraStatus.OFFLINE, lastError: 'Connection refused' }),
      );

      await TenantContext.run(ORG_ID, async () => {
        const result = await service.create({
          name: 'Lobby',
          rtspUrl: 'rtsp://192.168.1.50:554/stream1',
        } as any);

        // The write is not rejected by a failed reachability check...
        expect(cameraCreate).toHaveBeenCalledTimes(1);
        // ...it only seeds the health fields on the follow-up update.
        expect(result.status).toBe(CameraStatus.OFFLINE);
        expect(result.lastError).toBe('Connection refused');
      });
    });

    it('strips embedded credentials out of rtspUrl before persisting', async () => {
      const { service, cameraCreate, cameraUpdate } = buildService();
      cameraCreate.mockResolvedValue(baseCameraRow());
      cameraUpdate.mockResolvedValue(baseCameraRow({ status: CameraStatus.ONLINE }));

      await TenantContext.run(ORG_ID, async () => {
        await service.create({
          name: 'Lobby',
          rtspUrl: 'rtsp://admin:secret@192.168.1.50:554/stream1',
        } as any);
      });

      const data = cameraCreate.mock.calls[0][0].data;
      expect(data.rtspUrl).toBe('rtsp://192.168.1.50:554/stream1');
      expect(data.rtspUsername).toBe('admin');
      expect(data.rtspPasswordEnc).toBeDefined();
      expect(data.rtspPasswordEnc).not.toContain('secret');
    });

    it('rejects a malformed rtspUrl with a 400, not a soft failure', async () => {
      const { service } = buildService();

      await TenantContext.run(ORG_ID, async () => {
        await expect(
          service.create({ name: 'Lobby', rtspUrl: 'not a url' } as any),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
