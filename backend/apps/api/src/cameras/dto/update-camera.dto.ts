import { ApiPropertyOptional } from '@nestjs/swagger';
import { CameraSourceType, RecordingMode } from '@video-analytics/database';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateCameraDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: CameraSourceType })
  @IsOptional()
  @IsEnum(CameraSourceType)
  sourceType?: CameraSourceType;

  @ApiPropertyOptional({
    description: 'Pass null to unassign the camera from its zone.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string | null;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  usbDevicePath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileSourceUri?: string;

  @ApiPropertyOptional({ enum: RecordingMode })
  @IsOptional()
  @IsEnum(RecordingMode)
  recordingMode?: RecordingMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  retentionDaysOverride?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
