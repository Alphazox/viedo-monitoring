import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty()
  @IsUUID()
  siteId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;
}
