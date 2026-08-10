import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@video-analytics/common';
import { CameraSourceType, CameraStatus } from '@video-analytics/database';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListCamerasQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Rolls up through zone → floor → building → site.' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ enum: CameraStatus })
  @IsOptional()
  @IsEnum(CameraStatus)
  status?: CameraStatus;

  @ApiPropertyOptional({ enum: CameraSourceType })
  @IsOptional()
  @IsEnum(CameraSourceType)
  sourceType?: CameraSourceType;
}
