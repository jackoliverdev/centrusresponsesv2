import { forwardRef, Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from '@/stripe/stripe.controller';
import { DBService } from '@/db/db.service';
import { UserModule } from '@/user/user.module';
import { FirebaseAuthModule } from '@/firebase-auth/firebase-auth.module';
import { PlanModule } from '@/plan/plan.module';
import { SubscriptionService } from '@/subscription/subscription.service';
import { OrganizationModule } from '@/organization/organization.module';
import { PlanService } from '@/plan/plan.service';

@Module({
  providers: [StripeService, DBService, SubscriptionService, PlanService],
  controllers: [StripeController],
  exports: [StripeService],
  imports: [
    FirebaseAuthModule,
    forwardRef(() => UserModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => PlanModule),
  ],
})
export class StripeModule {}
