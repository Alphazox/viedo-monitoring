import { type ChildProcess, spawn } from 'child_process';
import { existsSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decrypt } from '@video-analytics/common';
import { Camera, CameraSourceType, TenantPrismaService } from '@video-analytics/database';
import { injectRtspCredentials } from '../cameras/utils/rtsp-url.util';
import { StoragePathsService } from '../storage/storage-paths.service';

export type StreamStatus = 'starting' | 'ready' | 'error' | 'stopped';

export interface StreamStatusResult {
  status: StreamStatus;
  error?: string;
}

const CONNECTION_CHECKABLE_SOURCE_TYPES: CameraSourceType[] = [
  CameraSourceType.RTSP,
  CameraSourceType.ONVIF,
];

const SEGMENT_FILENAME_PATTERN = /^index\.m3u8$|^seg\d+\.ts$/;

interface StreamSession {
  process: ChildProcess;
  dir: string;
  status: StreamStatus;
  error?: string;
  stderrTail: string;
  timeout: NodeJS.Timeout;
}

/**
 * Manages one ffmpeg child process per camera that reads its RTSP feed and
 * transcodes to HLS on disk, so the browser (which can't play raw RTSP) can
 * watch a near-live preview via hls.js. Interim — Phase 5's real ingestion
 * pipeline supersedes this.
 */
@Injectable()
export class LiveStreamService implements OnModuleDestroy {
  private readonly sessions = new Map<string, StreamSession>();

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly storage: StoragePathsService,
    private readonly config: ConfigService,
  ) {}

  async start(cameraId: string): Promise<StreamStatusResult> {
    const camera = await this.requireStreamableCamera(cameraId);

    const existing = this.sessions.get(cameraId);
    if (existing && (existing.status === 'starting' || existing.status === 'ready')) {
      return { status: existing.status, error: existing.error };
    }

    const password = camera.rtspPasswordEnc
      ? decrypt(camera.rtspPasswordEnc, this.config.getOrThrow<string>('CAMERA_CREDENTIALS_ENCRYPTION_KEY'))
      : undefined;
    const url = injectRtspCredentials(camera.rtspUrl!, camera.rtspUsername ?? undefined, password);

    const dir = this.storage.streamDir(cameraId);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const ffmpegPath = this.config.get<string>('FFMPEG_PATH', 'ffmpeg');
    const args = [
      '-rtsp_transport',
      'tcp',
      '-timeout',
      '10000000',
      '-i',
      url,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-tune',
      'zerolatency',
      '-g',
      '50',
      '-sc_threshold',
      '0',
      '-c:a',
      'aac',
      '-f',
      'hls',
      '-hls_time',
      '2',
      '-hls_list_size',
      '6',
      '-hls_flags',
      'delete_segments+append_list',
      '-hls_segment_filename',
      join(dir, 'seg%03d.ts'),
      join(dir, 'index.m3u8'),
    ];

    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });

    const session: StreamSession = {
      process: proc,
      dir,
      status: 'starting',
      stderrTail: '',
      timeout: setTimeout(
        () => this.stop(cameraId),
        this.config.get<number>('LIVE_STREAM_MAX_DURATION_MS', 1_800_000),
      ),
    };
    this.sessions.set(cameraId, session);

    proc.stderr?.on('data', (chunk: Buffer) => {
      session.stderrTail = (session.stderrTail + chunk.toString()).slice(-2000);
    });

    proc.on('error', (err) => {
      session.status = 'error';
      session.error = err.message;
    });

    proc.on('exit', (code) => {
      if (session.status === 'stopped') {
        rm(session.dir, { recursive: true, force: true }).catch(() => undefined);
        return;
      }
      session.status = 'error';
      session.error = session.stderrTail.trim().slice(-500) || `ffmpeg exited with code ${code}`;
    });

    return { status: 'starting' };
  }

  async status(cameraId: string): Promise<StreamStatusResult> {
    await this.requireStreamableCamera(cameraId);
    const session = this.sessions.get(cameraId);
    if (!session) {
      return { status: 'stopped' };
    }
    if (session.status === 'starting' && existsSync(join(session.dir, 'index.m3u8'))) {
      session.status = 'ready';
    }
    return { status: session.status, error: session.error };
  }

  async stop(cameraId: string): Promise<void> {
    const session = this.sessions.get(cameraId);
    if (!session) return;

    clearTimeout(session.timeout);
    session.status = 'stopped';
    this.sessions.delete(cameraId);
    session.process.kill('SIGTERM');
    setTimeout(() => {
      if (!session.process.killed) session.process.kill('SIGKILL');
    }, 3000);
  }

  /** Resolves an HLS playlist/segment path for a camera, verifying tenant ownership first. */
  async resolveFilePath(cameraId: string, filename: string): Promise<string | null> {
    if (!SEGMENT_FILENAME_PATTERN.test(filename)) {
      return null;
    }
    await this.requireStreamableCamera(cameraId, { skipConnectivityCheck: true });
    const session = this.sessions.get(cameraId);
    if (!session) return null;
    return join(session.dir, filename);
  }

  onModuleDestroy(): void {
    for (const cameraId of this.sessions.keys()) {
      this.stop(cameraId);
    }
  }

  private async requireStreamableCamera(
    cameraId: string,
    opts: { skipConnectivityCheck?: boolean } = {},
  ): Promise<Camera> {
    const camera = await this.tenantPrisma.client.camera.findUnique({ where: { id: cameraId } });
    if (!camera) {
      throw new NotFoundException('Camera not found');
    }
    if (
      !opts.skipConnectivityCheck &&
      (!CONNECTION_CHECKABLE_SOURCE_TYPES.includes(camera.sourceType) || !camera.rtspUrl)
    ) {
      throw new BadRequestException('Live preview only applies to RTSP/ONVIF cameras with a stream URL');
    }
    return camera;
  }
}
