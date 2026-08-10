import { createReadStream, existsSync } from 'fs';
import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, RequirePermissions } from '@video-analytics/common';
import type { FastifyReply } from 'fastify';
import { LiveStreamService } from './live-stream.service';

@ApiTags('cameras')
@ApiBearerAuth()
@Controller('cameras/:cameraId/stream')
export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) {}

  @Post('start')
  @RequirePermissions(PERMISSIONS.CAMERAS_STREAM)
  start(@Param('cameraId', ParseUUIDPipe) cameraId: string) {
    return this.liveStreamService.start(cameraId);
  }

  @Post('stop')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.CAMERAS_STREAM)
  async stop(@Param('cameraId', ParseUUIDPipe) cameraId: string): Promise<void> {
    await this.liveStreamService.stop(cameraId);
  }

  @Get('status')
  @RequirePermissions(PERMISSIONS.CAMERAS_STREAM)
  status(@Param('cameraId', ParseUUIDPipe) cameraId: string) {
    return this.liveStreamService.status(cameraId);
  }

  /** Serves the HLS playlist and .ts segments ffmpeg writes to disk — bypasses the {data} envelope, same as recordings streaming. */
  @Get(':filename')
  @RequirePermissions(PERMISSIONS.CAMERAS_STREAM)
  async file(
    @Param('cameraId', ParseUUIDPipe) cameraId: string,
    @Param('filename') filename: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const filePath = await this.liveStreamService.resolveFilePath(cameraId, filename);
    if (!filePath || !existsSync(filePath)) {
      reply.code(404).send();
      return;
    }

    const contentType = filename.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
    reply.code(200).header('Content-Type', contentType).header('Cache-Control', 'no-cache').send(createReadStream(filePath));
  }
}
