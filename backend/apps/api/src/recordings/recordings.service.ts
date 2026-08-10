import { type ChildProcess, spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { stat, unlink } from 'fs/promises';
import { extname } from 'path';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MultipartFile } from '@fastify/multipart';
import { Paginated, paginate } from '@video-analytics/common';
import { Recording, TenantContext, TenantPrismaService } from '@video-analytics/database';
import { StoragePathsService } from '../storage/storage-paths.service';
import type { ListRecordingsQueryDto } from './dto/list-recordings-query.dto';

const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/x-msvideo',
  'video/mpeg',
]);

/** MP4/MOV containers store a `moov` atom (duration/seek index) that browsers need before they can play progressively. */
const FASTSTART_MIME_TYPES = new Set(['video/mp4', 'video/quicktime']);

@Injectable()
export class RecordingsService {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly storage: StoragePathsService,
    private readonly config: ConfigService,
  ) {}

  async upload(
    file: MultipartFile,
    title: string | undefined,
    cameraId: string | undefined,
    uploadedByUserId: string,
  ): Promise<Recording> {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported video type: ${file.mimetype}`);
    }

    if (cameraId) {
      const camera = await this.tenantPrisma.client.camera.findUnique({ where: { id: cameraId } });
      if (!camera) {
        throw new NotFoundException('Camera not found');
      }
    }

    const storedFilename = `${randomUUID()}${extname(file.filename) || '.mp4'}`;
    const destPath = this.storage.recordingFilePath(storedFilename);
    const needsFaststart = FASTSTART_MIME_TYPES.has(file.mimetype);
    const writePath = needsFaststart ? `${destPath}.upload` : destPath;

    try {
      await pipeline(file.file, createWriteStream(writePath));
    } catch (error) {
      await unlink(writePath).catch(() => undefined);
      throw error;
    }

    if (file.file.truncated) {
      await unlink(writePath).catch(() => undefined);
      throw new BadRequestException('File exceeds the maximum upload size');
    }

    if (needsFaststart) {
      try {
        await this.remuxFaststart(writePath, destPath);
      } catch (error) {
        await unlink(writePath).catch(() => undefined);
        await unlink(destPath).catch(() => undefined);
        throw new BadRequestException(
          `Uploaded file could not be processed as video: ${(error as Error).message.slice(0, 300)}`,
        );
      } finally {
        await unlink(writePath).catch(() => undefined);
      }
    }

    const { size } = await stat(destPath);

    return this.tenantPrisma.client.recording.create({
      data: {
        organizationId: TenantContext.requireOrganizationId(),
        cameraId,
        uploadedByUserId,
        title: title?.trim() || file.filename,
        originalFilename: file.filename,
        storedFilename,
        mimeType: file.mimetype,
        sizeBytes: size,
      },
    });
  }

  async findAll(query: ListRecordingsQueryDto): Promise<Paginated<Recording>> {
    const { page, limit, cameraId } = query;
    const where = { ...(cameraId && { cameraId }) };

    const [items, total] = await this.tenantPrisma.client.$transaction([
      this.tenantPrisma.client.recording.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.tenantPrisma.client.recording.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: string): Promise<Recording> {
    const recording = await this.tenantPrisma.client.recording.findUnique({ where: { id } });
    if (!recording) {
      throw new NotFoundException('Recording not found');
    }
    return recording;
  }

  async remove(id: string): Promise<void> {
    const recording = await this.findById(id);
    await this.tenantPrisma.client.recording.delete({ where: { id } });
    await unlink(this.storage.recordingFilePath(recording.storedFilename)).catch(() => undefined);
  }

  filePath(recording: Recording): string {
    return this.storage.recordingFilePath(recording.storedFilename);
  }

  /**
   * Remuxes (no re-encode — `-c copy`) so the `moov` atom moves to the front
   * of the file. Many export/AI-generation tools write it at the end, which
   * leaves browsers unable to read duration/seek info until the whole file
   * downloads — playback gets stuck at 0:00 with a black frame.
   */
  private remuxFaststart(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegPath = this.config.get<string>('FFMPEG_PATH', 'ffmpeg');
      const proc: ChildProcess = spawn(ffmpegPath, [
        '-y',
        '-i',
        inputPath,
        '-c',
        'copy',
        '-movflags',
        '+faststart',
        outputPath,
      ]);

      let stderrTail = '';
      proc.stderr?.on('data', (chunk: Buffer) => {
        stderrTail = (stderrTail + chunk.toString()).slice(-1000);
      });
      proc.on('error', reject);
      proc.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderrTail.trim() || `ffmpeg exited with code ${code}`));
        }
      });
    });
  }
}
