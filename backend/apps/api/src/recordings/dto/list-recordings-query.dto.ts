import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@video-analytics/common';
import { IsOptional, IsUUID } from 'class-validator';

export class ListRecordingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cameraId?: string;
}
