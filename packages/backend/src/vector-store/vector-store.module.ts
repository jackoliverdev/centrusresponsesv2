import { Module } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import { DBModule } from '@/db/db.module';
import { OpenAiModule } from '@/open-ai/open-ai.module';
import { TagModule } from '@/tag/tag.module';
@Module({
  providers: [VectorStoreService],
  imports: [DBModule, OpenAiModule, TagModule],
  exports: [VectorStoreService],
})
export class VectorStoreModule {}
