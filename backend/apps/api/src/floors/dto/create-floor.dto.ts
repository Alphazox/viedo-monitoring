import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateFloorDto {
  @ApiProperty()
  @IsUUID()
  buildingId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  level?: number;
}
