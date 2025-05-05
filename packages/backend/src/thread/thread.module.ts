import { forwardRef, Module } from '@nestjs/common';
import { ThreadService } from './thread.service';
import { OpenAiModule } from '@/open-ai/open-ai.module';
import { DocumentModule } from '@/document/document.module';
import { DBService } from '@/db/db.service';
import { ThreadController } from '@/thread/thread.controller';
import { UserService } from '@/user/user.service';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';
import { OrganizationModule } from '@/organization/organization.module';
import { TagModule } from '@/tag/tag.module';
import { VectorStoreModule } from '@/vector-store/vector-store.module';

@Module({
  providers: [ThreadService, UserService, FirebaseAuthService, DBService],
  exports: [ThreadService],
  imports: [OpenAiModule, VectorStoreModule, DocumentModule, TagModule],
  controllers: [ThreadController],
})
export class ThreadModule {}
