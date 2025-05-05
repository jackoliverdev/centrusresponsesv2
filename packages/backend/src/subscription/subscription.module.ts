import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { DBModule } from '@/db/db.module';
import { OrganizationService } from '@/organization/organization.service';
import { OrganizationModule } from '@/organization/organization.module';
import { FirebaseAuthModule } from '@/firebase-auth/firebase-auth.module';
import { PlanModule } from '@/plan/plan.module';

@Module({
  providers: [SubscriptionService, OrganizationService],
  exports: [SubscriptionService],
  imports: [
    DBModule,
    forwardRef(() => OrganizationModule),
    FirebaseAuthModule,
    forwardRef(() => PlanModule),
  ],
})
export class SubscriptionModule {}
