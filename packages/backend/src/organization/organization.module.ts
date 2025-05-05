import { forwardRef, Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';
import { DBService } from '@/db/db.service';
import { UserService } from '@/user/user.service';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { PlanService } from '@/plan/plan.service';
import { StripeModule } from '@/stripe/stripe.module';
import { SubscriptionModule } from '@/subscription/subscription.module';
import { TagModule } from '@/tag/tag.module';
import { VectorStoreModule } from '@/vector-store/vector-store.module';

@Module({
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    FirebaseAuthService,
    DBService,
    UserService,
    PlanService,
  ],
  imports: [
    AuthGuardModule,
    TagModule,
    VectorStoreModule,
    forwardRef(() => StripeModule),
    forwardRef(() => SubscriptionModule),
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}
