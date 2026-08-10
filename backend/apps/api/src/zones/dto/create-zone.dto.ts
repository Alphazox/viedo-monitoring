import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty()
  @IsUUID()
  floorId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;
}
