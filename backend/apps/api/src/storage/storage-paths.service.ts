import { mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Resolves and lazily creates the on-disk locations for uploaded recordings and live-stream HLS output. */
@Injectable()
export class StoragePathsService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('STORAGE_DIR', './storage'));
  }

  get recordingsDir(): string {
    const dir = join(this.root, 'recordings');
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  get streamsDir(): string {
    const dir = join(this.root, 'streams');
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  recordingFilePath(storedFilename: string): string {
    return join(this.recordingsDir, storedFilename);
  }

  /** Per-camera HLS output directory — created on demand by the stream service when a session starts. */
  streamDir(cameraId: string): string {
    return join(this.streamsDir, cameraId);
  }
}
