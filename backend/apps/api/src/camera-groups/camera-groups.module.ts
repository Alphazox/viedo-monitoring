import { Module } from '@nestjs/common';
import { CameraGroupsController } from './camera-groups.controller';
import { CameraGroupsService } from './camera-groups.service';

@Module({
  controllers: [CameraGroupsController],
  providers: [CameraGroupsService],
})
export class CameraGroupsModule {}
