import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DBModule } from '@/db/db.module';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { StorageModule } from '@/storage/storage.module';
import { OpenAiModule } from '@/open-ai/open-ai.module';
import { FirecrawlModule } from '@/firecrawl/firecrawl.module';
import { StripeService } from '@/stripe/stripe.service';
import { PlanService } from '@/plan/plan.service';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { OrganizationModule } from '@/organization/organization.module';
import { TagModule } from '@/tag/tag.module';
import { VectorStoreModule } from '@/vector-store/vector-store.module';
import { DocumentFolderModule } from './document-folder.module';

@Module({
  providers: [
    DocumentService,
    StripeService,
    PlanService
  ],
  controllers: [DocumentController],
  exports: [DocumentService],
  imports: [
    DBModule,
    AuthGuardModule,
    DocumentModule,
    StorageModule,
    VectorStoreModule,
    OpenAiModule,
    FirecrawlModule,
    SubscriptionModule,
    OrganizationModule,
    TagModule,
    DocumentFolderModule,
  ],
})
export class DocumentModule {}
