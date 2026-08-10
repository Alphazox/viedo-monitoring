import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { LiveStreamController } from './live-stream.controller';
import { LiveStreamService } from './live-stream.service';

@Module({
  imports: [StorageModule],
  controllers: [LiveStreamController],
  providers: [LiveStreamService],
})
export class LiveStreamModule {}
