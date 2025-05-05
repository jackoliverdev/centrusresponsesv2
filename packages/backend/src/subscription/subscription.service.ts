import { DBService } from '@/db/db.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OrganizationService } from '@/organization/organization.service';
import { PlanService } from '@/plan/plan.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private dbService: DBService,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService,
    @Inject(forwardRef(() => PlanService))
    private planService: PlanService,
  ) {}

  async createSubscription(
    newPlanId: number,
    organizationId: number,
    userId: number,
    subscriptionId: string,
    customerId: string,
    live: boolean,
  ) {
    const supabase = this.dbService.supabase;

    if (!organizationId || !newPlanId || !userId || !subscriptionId) {
      return null;
    }

    // check that the user exists and belongs to the organization
    await Promise.all([
      this.organizationService.getUserOrganization(userId, organizationId),
      this.organizationService.getFlatOrganization(organizationId),
      this.planService.getPlan(newPlanId),
    ]);

    const { data: subscription } = await supabase
      .from('subscriptions')
      .upsert(
        {
          plan_id: newPlanId,
          user_id: userId,
          organization_id: organizationId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          status: 'active',
          mode: live ? 'live' : 'dev',
        },
        { onConflict: 'stripe_subscription_id' },
      )
      .select()
      .throwOnError();

    return subscription;
  }

  async activateSubscription(subscriptionId: string) {
    return this.changeSubscriptionStatus(subscriptionId, 'active');
  }

  async pauseSubscription(subscriptionId: string) {
    return this.changeSubscriptionStatus(subscriptionId, 'paused');
  }

  async cancelSubscription(subscriptionId: string) {
    return await this.changeSubscriptionStatus(subscriptionId, 'cancelled');
  }

  async changeSubscriptionStatus(
    subscriptionId: string,
    status: 'active' | 'cancelled' | 'paused',
  ) {
    const supabase = this.dbService.supabase;

    if (!subscriptionId) {
      return null;
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .update({ status })
      .eq('stripe_subscription_id', subscriptionId)
      .select()
      .maybeSingle()
      .throwOnError();

    return subscription;
  }

  async getActiveSubscription(organizationId: number, live: boolean) {
    const supabase = this.dbService.supabase;
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .eq('mode', live ? 'live' : 'dev')
      .maybeSingle();

    return subscription;
  }

  async getSubscriptionById(subscriptionId: string) {
    const supabase = this.dbService.supabase;
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()
      .throwOnError();

    return subscription;
  }

  async getSubscription(
    planId: number,
    organizationId: number,
    status: 'active' | 'cancelled' | 'paused',
  ) {
    const supabase = this.dbService.supabase;
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('plan_id', planId)
      .eq('organization_id', organizationId)
      .eq('status', status)
      .maybeSingle()
      .throwOnError();

    return subscription;
  }

  async onSubscriptionPlanChange(
    stripeSubscriptionId: string,
    stripePriceId: string,
  ) {
    const supabase = this.dbService.supabase;

    const plan = await this.planService.getPlanByPriceId(stripePriceId);

    if (!plan) {
      return;
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .update({ plan_id: plan.id, status: 'active' })
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select('*')
      .maybeSingle()
      .throwOnError();

    if (!subscription) {
      return;
    }

    // means the user has changed the plan on the subscription via the portal
    // change the plan for the organization
    await this.planService.changePlanForOrganization(
      plan.id,
      subscription.stripe_subscription_id,
      subscription.organization_id,
      subscription.user_id,
    );
  }
}
