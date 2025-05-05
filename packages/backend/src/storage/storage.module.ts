import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { DBModule } from '@/db/db.module';

@Module({
  providers: [StorageService],
  exports: [StorageService],
  imports: [DBModule],
})
export class StorageModule {}
