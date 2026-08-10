import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CameraConnectionCheckService } from './camera-connection-check.service';
import { CameraHealthScheduler } from './camera-health.scheduler';
import { CamerasController } from './cameras.controller';
import { CamerasService } from './cameras.service';
import { OnvifDiscoveryService } from './onvif-discovery.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [CamerasController],
  providers: [
    CamerasService,
    CameraConnectionCheckService,
    OnvifDiscoveryService,
    CameraHealthScheduler,
  ],
  exports: [CamerasService],
})
export class CamerasModule {}
