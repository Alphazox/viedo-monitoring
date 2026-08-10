import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/** The upload body is multipart/form-data (the file); title/cameraId travel as query params to keep multipart parsing to a single field. */
export class UploadRecordingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cameraId?: string;
}
