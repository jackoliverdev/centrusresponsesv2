import { forwardRef, Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { DBService } from '@/db/db.service';
import { PlanController } from '@/plan/plan.controller';
import { UserModule } from '@/user/user.module';
import { FirebaseAuthModule } from '@/firebase-auth/firebase-auth.module';
import { OrganizationModule } from '@/organization/organization.module';
import { SubscriptionService } from '@/subscription/subscription.service';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { StripeService } from '@/stripe/stripe.service';
import { OrganizationService } from '@/organization/organization.service';

@Module({
  providers: [PlanService, DBService, SubscriptionService, StripeService, OrganizationService],
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => OrganizationModule),
    FirebaseAuthModule,
    SubscriptionModule,
  ],
  controllers: [PlanController],
  exports: [PlanService],
})
export class PlanModule {}
