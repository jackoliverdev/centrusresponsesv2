import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DBService } from '@/db/db.service';
import {
  CustomPlanDto,
  PlanAddonSchema,
  PlanSchema,
  UpdatePlanAddonDto,
} from 'common';
import { transformPlan, transformPlanAddon } from '@/plan/plan.util';
import { StripeService } from '@/stripe/stripe.service';
import { OrganizationService } from '@/organization/organization.service';
import { SubscriptionService } from '@/subscription/subscription.service';

@Injectable()
export class PlanService {
  constructor(
    private dbService: DBService,
    @Inject(forwardRef(() => StripeService))
    private stripeService: StripeService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService,
  ) {}

  async getAll(): Promise<PlanSchema[]> {
    const supabase = this.dbService.supabase;

    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .neq('slug', 'custom')
      .order('price', { ascending: true })
      .throwOnError();

    return plans.map(transformPlan);
  }

  async getPlan(id: number): Promise<PlanSchema> {
    const supabase = this.dbService.supabase;

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single()
      .throwOnError();

    return transformPlan(plan);
  }

  async getPlanByPriceId(stripePriceId: string): Promise<PlanSchema> {
    const supabase = this.dbService.supabase;

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq(this.stripeService.priceIdPath, stripePriceId)
      .maybeSingle()
      .throwOnError();

    return plan && transformPlan(plan);
  }

  async getFreePlan(): Promise<PlanSchema> {
    const supabase = this.dbService.supabase;

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', 'free')
      .single()
      .throwOnError();

    return transformPlan(plan);
  }

  async getAddons(): Promise<PlanAddonSchema[]> {
    const supabase = this.dbService.supabase;

    const { data: addons } = await supabase
      .from('plan_addons')
      .select('*')
      .throwOnError();

    return addons.map(transformPlanAddon);
  }

  async getAddon(addonId: number): Promise<PlanAddonSchema> {
    const supabase = this.dbService.supabase;

    const { data: addon } = await supabase
      .from('plan_addons')
      .select('*')
      .eq('id', addonId)
      .single()
      .throwOnError();

    return transformPlanAddon(addon);
  }

  async getAllPlanAddons() {
    const supabase = this.dbService.supabase;

    const { data: addons } = await supabase
      .from('plans')
      .select('*')
      .in('slug', ['addon_messages', 'addon_storage', 'addon_users'])
      .throwOnError();

    return addons.map(transformPlan).reduce(
      (acc, curr) => {
        if (curr.slug === 'addon_messages') {
          acc.messages = curr;
        } else if (curr.slug === 'addon_storage') {
          acc.storage = curr;
        } else if (curr.slug === 'addon_users') {
          acc.users = curr;
        }

        return acc;
      },
      {} as { messages: PlanSchema; storage: PlanSchema; users: PlanSchema },
    );
  }

  async getAddonForOrganization(
    organizationId: number,
  ): Promise<PlanAddonSchema> {
    const supabase = this.dbService.supabase;

    if (!organizationId) {
      return null;
    }

    const organization =
      await this.organizationService.getFlatOrganization(organizationId);

    if (!organization.addon_id) {
      return null;
    }

    const { data: addon } = await supabase
      .from('plan_addons')
      .select('*')
      .eq('id', organization.addon_id)
      .single()
      .throwOnError();

    return transformPlanAddon(addon);
  }

  async updateAddonForOrganization(
    values: UpdatePlanAddonDto,
    options: {
      organizationId: number;
      incrementValues: boolean;
    },
  ) {
    const supabase = this.dbService.supabase;

    if (!options.organizationId) {
      return null;
    }

    const organization = await this.organizationService.getFlatOrganization(
      options.organizationId,
    );

    const addon = await this.getAddon(organization.addon_id);

    if (!addon) {
      return null;
    }

    if (options.incrementValues) {
      // add the old and new values if increment
      values.extraMessages += addon.extraMessages;
      values.extraStorage += addon.extraStorage;
      values.extraUsers += addon.extraUsers;
    }

    await supabase
      .from('plan_addons')
      .update({
        extra_messages: values.extraMessages,
        extra_storage: values.extraStorage,
        extra_users: values.extraUsers,
      })
      .eq('id', organization.addon_id)
      .single()
      .throwOnError();
  }

  async updateCustomLimitsForOrganization(
    values: CustomPlanDto,
    options: {
      organizationId: number;
    },
  ) {
    const supabase = this.dbService.supabase;

    if (!options.organizationId) {
      throw new BadRequestException('Organization ID is required.');
    }

    const organization = await this.organizationService.getFlatOrganization(
      options.organizationId,
    );

    const { data: plan } = await supabase
      .from('plans')
      .upsert(
        {
          id: organization.custom_plan_id ?? undefined,
          name: `Custom Plan (${organization.name}, ${organization.id})`,
          slug: 'custom',
          message_limit: values.messages,
          storage_limit: values.storage,
          user_limit: values.users,
        },
        { onConflict: 'id' },
      )
      .select('id')
      .single()
      .throwOnError();

    await supabase
      .from('organizations')
      .update({ custom_plan_id: plan.id })
      .eq('id', organization.id)
      .select('*')
      .throwOnError();
  }

  async changePlanForOrganization(
    newPlanId: number,
    stripeSubscriptionId: string,
    organizationId: number,
    userId: number,
  ) {
    const supabase = this.dbService.supabase;

    if (!organizationId || !newPlanId || !userId) {
      return null;
    }

    // check that the user exists and belongs to the organization
    const [, organization, plan] = await Promise.all([
      this.organizationService.getUserOrganization(userId, organizationId),
      this.organizationService.getFlatOrganization(organizationId),
      this.getPlan(newPlanId),
    ]);

    if (plan.slug === 'free') {
      // for free plan, handle a bit differently
      return this.switchToFreePlan(organizationId, stripeSubscriptionId);
    }

    // create new addons if new plan supports addons and organization does not have existing addons
    if (!organization.addon_id && plan.addons) {
      const { data: addon } = await supabase
        .from('plan_addons')
        .insert({
          extra_messages: 0,
          extra_storage: 0,
          extra_users: 0,
        })
        .select()
        .single()
        .throwOnError();

      organization.addon_id = addon.id;
    }

    const { data: updated } = await supabase
      .from('organizations')
      .update({ plan_id: newPlanId, addon_id: organization.addon_id })
      .eq('id', organizationId)
      .select()
      .single()
      .throwOnError();

    return updated;
  }

  async switchToFreePlan(organizationId: number, stripeSubscriptionId: string) {
    const supabase = this.dbService.supabase;

    if (!organizationId) {
      return null;
    }

    // check that the user exists and belongs to the organization
    const [, freePlan] = await Promise.all([
      this.organizationService.getFlatOrganization(organizationId),
      this.getFreePlan(),
    ]);

    // cancel existing subscription
    const subscription =
      await this.subscriptionService.getSubscriptionById(stripeSubscriptionId);

    if (subscription) {
      await this.subscriptionService.cancelSubscription(
        subscription.stripe_subscription_id,
      );
    }

    await supabase
      .from('organizations')
      .update({ plan_id: freePlan.id })
      .eq('id', organizationId)
      .single()
      .throwOnError();
  }
}
