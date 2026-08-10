import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class TestConnectionDto {
  @ApiProperty({ description: 'May embed credentials (rtsp://user:pass@host/...) or be bare.' })
  @IsString()
  @MinLength(1)
  rtspUrl!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rtspUsername?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rtspPassword?: string;
}
