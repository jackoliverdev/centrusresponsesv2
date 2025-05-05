import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAiService } from '@/open-ai/open-ai.service';
import { DBModule } from '@/db/db.module';
import { UserModule } from '@/user/user.module';
import { FirebaseAuthModule } from '@/firebase-auth/firebase-auth.module';
import { ThreadModule } from '@/thread/thread.module';
import { OrganizationModule } from '@/organization/organization.module';
import { TagModule } from '@/tag/tag.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService, OpenAiService],
  imports: [
    DBModule,
    UserModule,
    FirebaseAuthModule,
    ThreadModule,
    OrganizationModule,
    TagModule,
  ],
  exports: [ChatService],
})
export class ChatModule {}
