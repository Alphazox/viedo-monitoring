import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { decrypt } from '@video-analytics/common';
import { Camera, CameraSourceType, CameraStatus, PrismaService } from '@video-analytics/database';
import { CameraConnectionCheckService } from './camera-connection-check.service';
import { injectRtspCredentials } from './utils/rtsp-url.util';

const DEFAULT_CONCURRENCY = 5;

/**
 * Interim stand-in for real ingestion-driven health telemetry (Phase 5):
 * every 2 minutes, re-probes every active RTSP/ONVIF camera across all
 * organizations. Runs outside any request's TenantContext — this is
 * cross-cutting background work, so it uses the unscoped PrismaService
 * directly, the same escape hatch Phase 3 documented for this kind of job.
 * Concurrency-capped so a large camera count doesn't fork-bomb the API
 * container; the first thing to move to a proper worker queue once camera
 * counts justify it (Phase 5's territory).
 */
@Injectable()
export class CameraHealthScheduler {
  private readonly logger = new Logger(CameraHealthScheduler.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionCheck: CameraConnectionCheckService,
    private readonly config: ConfigService,
  ) {}

  @Cron('*/2 * * * *')
  async poll(): Promise<void> {
    if (this.running) {
      this.logger.warn('Previous camera health poll is still running — skipping this tick');
      return;
    }

    this.running = true;
    try {
      await this.pollAll();
    } finally {
      this.running = false;
    }
  }

  private async pollAll(): Promise<void> {
    const cameras = await this.prisma.camera.findMany({
      where: {
        isActive: true,
        sourceType: { in: [CameraSourceType.RTSP, CameraSourceType.ONVIF] },
        rtspUrl: { not: null },
      },
    });

    const concurrency = this.config.get<number>(
      'CAMERA_HEALTH_POLL_CONCURRENCY',
      DEFAULT_CONCURRENCY,
    );
    for (let i = 0; i < cameras.length; i += concurrency) {
      const batch = cameras.slice(i, i + concurrency);
      await Promise.all(batch.map((camera) => this.checkOne(camera)));
    }
  }

  private async checkOne(camera: Camera): Promise<void> {
    if (!camera.rtspUrl) {
      return;
    }

    try {
      const password = camera.rtspPasswordEnc
        ? decrypt(
            camera.rtspPasswordEnc,
            this.config.getOrThrow<string>('CAMERA_CREDENTIALS_ENCRYPTION_KEY'),
          )
        : undefined;
      const url = injectRtspCredentials(camera.rtspUrl, camera.rtspUsername ?? undefined, password);
      const result = await this.connectionCheck.check(url);

      await this.prisma.camera.update({
        where: { id: camera.id },
        data: {
          status: result.success ? CameraStatus.ONLINE : CameraStatus.OFFLINE,
          lastCheckedAt: new Date(),
          lastError: result.error ?? null,
          streamErrorCount: result.success ? 0 : { increment: 1 },
        },
      });
    } catch (error) {
      this.logger.error(`Health check failed for camera ${camera.id}: ${(error as Error).message}`);
    }
  }
}
