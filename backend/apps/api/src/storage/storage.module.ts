import { Module } from '@nestjs/common';
import { StoragePathsService } from './storage-paths.service';

@Module({
  providers: [StoragePathsService],
  exports: [StoragePathsService],
})
export class StorageModule {}
