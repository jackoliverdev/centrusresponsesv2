import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { OrganizationModule } from './organization/organization.module';
import { UserModule } from './user/user.module';
import { FirebaseAuthModule } from './firebase-auth/firebase-auth.module';
import { DBService } from './db/db.service';
import { DBModule } from './db/db.module';
import { AppController } from './app.controller';
import { TestModule } from './test/test.module';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { ChatModule } from './chat/chat.module';
import { DocumentModule } from './document/document.module';
import { DocumentFolderModule } from './document/document-folder.module';
import { GoogleModule } from './google/google.module';
import { StorageModule } from './storage/storage.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { TwilioModule } from './twilio/twilio.module';
import { MicrosoftModule } from './microsoft/microsoft.module';
import { TeamsBotModule } from './teams-bot/teams-bot.module';
import { OpenAiService } from './open-ai/open-ai.service';
import { OpenAiModule } from './open-ai/open-ai.module';
import { ThreadModule } from './thread/thread.module';
import { FirecrawlModule } from './firecrawl/firecrawl.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { SendgridModule } from './sendgrid/sendgrid.module';
import { PlanModule } from '@/plan/plan.module';
import { StripeModule } from '@/stripe/stripe.module';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { TagModule } from '@/tag/tag.module';
import { HelpContentModule } from '@/help-content/help-content.module';
import { AudioModule } from './audio/audio.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AdminModule,
    OrganizationModule,
    UserModule,
    FirebaseAuthModule,
    DBModule,
    TestModule,
    AuthGuardModule,
    ChatModule,
    DocumentModule,
    DocumentFolderModule,
    GoogleModule,
    StorageModule,
    WhatsappModule,
    TwilioModule,
    MicrosoftModule,
    TeamsBotModule,
    OpenAiModule,
    ThreadModule,
    FirecrawlModule,
    ChatbotModule,
    SendgridModule,
    PlanModule,
    StripeModule,
    SubscriptionModule,
    TagModule,
    HelpContentModule,
    AudioModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [FirebaseAuthService, DBService, OpenAiService],
})
export class AppModule {}
