import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, RequirePermissions } from '@video-analytics/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ListRecordingsQueryDto } from './dto/list-recordings-query.dto';
import { UploadRecordingQueryDto } from './dto/upload-recording-query.dto';
import { RecordingsService } from './recordings.service';

const RANGE_PATTERN = /^bytes=(\d*)-(\d*)$/;

@ApiTags('recordings')
@ApiBearerAuth()
@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @RequirePermissions(PERMISSIONS.RECORDINGS_CREATE)
  async upload(
    @Query() query: UploadRecordingQueryDto,
    @Req() req: FastifyRequest,
    @CurrentUser() user: JwtPayload,
  ) {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('A video file is required (multipart field "file")');
    }
    return this.recordingsService.upload(file, query.title, query.cameraId, user.sub);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.RECORDINGS_READ)
  findAll(@Query() query: ListRecordingsQueryDto) {
    return this.recordingsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.RECORDINGS_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.recordingsService.findById(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(PERMISSIONS.RECORDINGS_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.recordingsService.remove(id);
  }

  /**
   * Serves the raw video bytes with HTTP Range support so <video> can seek.
   * Uses @Res() to bypass the global TransformInterceptor's {data} envelope,
   * which doesn't apply to binary streams.
   */
  @Get(':id/stream')
  @RequirePermissions(PERMISSIONS.RECORDINGS_READ)
  async stream(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const recording = await this.recordingsService.findById(id);
    const filePath = this.recordingsService.filePath(recording);
    const { size } = await stat(filePath);

    const range = req.headers.range;
    const match = typeof range === 'string' ? RANGE_PATTERN.exec(range) : null;

    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : size - 1;

      if (start >= size || end >= size || start > end) {
        reply.code(416).header('Content-Range', `bytes */${size}`).send();
        return;
      }

      reply
        .code(206)
        .header('Content-Range', `bytes ${start}-${end}/${size}`)
        .header('Accept-Ranges', 'bytes')
        .header('Content-Length', end - start + 1)
        .header('Content-Type', recording.mimeType)
        .header('Cache-Control', 'no-store')
        .send(createReadStream(filePath, { start, end }));
      return;
    }

    reply
      .code(200)
      .header('Accept-Ranges', 'bytes')
      .header('Content-Length', size)
      .header('Content-Type', recording.mimeType)
      .header('Cache-Control', 'no-store')
      .send(createReadStream(filePath));
  }
}
