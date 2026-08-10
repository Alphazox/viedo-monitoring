import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CameraSourceType, RecordingMode } from '@video-analytics/database';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateCameraDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ enum: CameraSourceType, default: CameraSourceType.RTSP })
  @IsOptional()
  @IsEnum(CameraSourceType)
  sourceType?: CameraSourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({
    description:
      'RTSP/ONVIF stream URL. May embed credentials (rtsp://user:pass@host/...) or be bare and paired with rtspUsername/rtspPassword.',
  })
  @IsOptional()
  @IsString()
  rtspUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rtspUsername?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rtspPassword?: string;

  @ApiPropertyOptional({ description: 'USB device path, for sourceType USB.' })
  @IsOptional()
  @IsString()
  usbDevicePath?: string;

  @ApiPropertyOptional({ description: 'Modeled, not yet functional — see LLD §10.' })
  @IsOptional()
  @IsString()
  fileSourceUri?: string;

  @ApiPropertyOptional({ enum: RecordingMode, default: RecordingMode.EVENT_ONLY })
  @IsOptional()
  @IsEnum(RecordingMode)
  recordingMode?: RecordingMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  retentionDaysOverride?: number;
}
