import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@video-analytics/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AuditLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string;
}
