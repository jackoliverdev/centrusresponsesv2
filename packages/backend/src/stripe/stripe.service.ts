import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import Stripe from 'stripe';
import { WEBHOOK_EVENTS } from '@/stripe/stripe.constants';
import { API } from 'common';
import { PlanService } from '@/plan/plan.service';
import { SubscriptionService } from '@/subscription/subscription.service';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;
  private isProd: boolean = false;
  private readonly inAppCancellationComment: string = '[cancelled in-app]';

  constructor(
    @Inject(forwardRef(() => PlanService))
    private planService: PlanService,
    @Inject(forwardRef(() => SubscriptionService))
    private subscriptionService: SubscriptionService,
  ) {}

  async onModuleInit() {
    // check if there is a stripe key, and it doesn't start with test
    this.isProd =
      !!process.env.STRIPE_SKEY &&
      process.env.STRIPE_SKEY.startsWith('sk_live_');

    this.stripe = new Stripe(process.env.STRIPE_SKEY, {
      apiVersion: '2025-01-27.acacia',
      appInfo: {
        name: 'Centrus AI',
        url: process.env.WEB_APP_URL,
      },
    });

    // only need to register these in production, the webhook endpoint and billing config
    if (this.isProd) {
      // set this to the live api url for production only
      const apiUrl = process.env.API_URL;

      if (apiUrl) {
        const webhook_url = `${apiUrl}${API.stripeWebhook.path}`;
        const webhooks = await this.stripe.webhookEndpoints.list();

        // register if it doesnt exist
        if (!webhooks.data.some(({ url }) => url === webhook_url)) {
          await this.stripe.webhookEndpoints.create({
            url: `${apiUrl}${API.stripeWebhook.path}`,
            enabled_events: [
              // sync with only events handled in this.handleWebhookEvent()
              WEBHOOK_EVENTS.checkoutSessionCompleted,
              WEBHOOK_EVENTS.subscriptionDeleted,
              WEBHOOK_EVENTS.subscriptionPaused,
              WEBHOOK_EVENTS.subscriptionUpdated,
            ],
          });
        }
      }

      const billingConfig = await this.stripe.billingPortal.configurations.list({
        active: true,
        is_default: true,
      });

      if (!billingConfig.data.length) {
        await this.stripe.billingPortal.configurations.create({
          features: {
            invoice_history: { enabled: true },
            subscription_cancel: { enabled: true },
            payment_method_update: { enabled: true },
            subscription_update: { enabled: true },
          },
        });
      }
    }
  }

  async createCheckoutPlan(metadata: {
    userId: number;
    email: string;
    newPlanId: number;
    organizationId: number;
  }) {
    const subscription = await this.subscriptionService.getActiveSubscription(
      metadata.organizationId,
      this.isProd,
    );

    // for organization with existing subscription, redirect to customer portal
    if (subscription) {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${process.env.WEB_APP_URL}/settings/billing`,
      });

      return { url: session.url };
    }

    const plan = await this.planService.getPlan(metadata.newPlanId);
    const priceId = this.isProd
      ? plan.stripePriceId
      : plan.sandboxStripePriceId;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: metadata.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.WEB_APP_URL}/subscription/success`,
      cancel_url: `${process.env.WEB_APP_URL}/subscription/cancel`,
      metadata,
    });

    return { url: session.url };
  }

  async createCheckoutPlanAddons({
    quantities,
    ...metadata
  }: {
    userId: number;
    email: string;
    organizationId: number;
    quantities: { messages?: number; storage?: number; users?: number };
  }) {
    const subscription = await this.subscriptionService.getActiveSubscription(
      metadata.organizationId,
      this.isProd,
    );

    // only for organizations with existing subscription
    if (!subscription) {
      throw new BadRequestException(
        'Subscription required to purchase add-ons',
      );
    }

    const plan = await this.planService.getPlan(subscription.plan_id);

    if (!plan.addons) {
      throw new BadRequestException(
        'Subscription plan does not support add-ons',
      );
    }

    const { messages, storage, users } =
      await this.planService.getAllPlanAddons();

    const messagePriceId = this.isProd
      ? messages.stripePriceId
      : messages.sandboxStripePriceId;

    const storagePriceId = this.isProd
      ? storage.stripePriceId
      : storage.sandboxStripePriceId;

    const usersPriceId = this.isProd
      ? users.stripePriceId
      : users.sandboxStripePriceId;

    const lineItems: Stripe.Checkout.SessionCreateParams['line_items'] = [];

    if (quantities.messages) {
      lineItems.push({ price: messagePriceId, quantity: quantities.messages });
    }

    if (quantities.storage) {
      lineItems.push({
        price: storagePriceId,
        // only for storage, divide the bytes to gigabytes
        quantity: quantities.storage / storage.unitSize,
      });
    }

    if (quantities.users) {
      lineItems.push({
        price: usersPriceId,
        quantity: quantities.users,
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer: subscription.stripe_customer_id,
      line_items: lineItems,
      success_url: `${process.env.WEB_APP_URL}/subscription/success`,
      cancel_url: `${process.env.WEB_APP_URL}/subscription/cancel`,
      metadata: {
        ...metadata,
        action: 'purchase-addons',
        currentPlanId: plan.id,
        messages: quantities.messages,
        storage: quantities.storage,
        users: quantities.users,
      },
    });

    return { url: session.url };
  }

  async cancelSubscription(id: string, organizationId: number) {
    const subscription = await this.stripe.subscriptions.retrieve(id);
    if (subscription) {
      await this.stripe.subscriptions.cancel(id, {
        prorate: true,
        cancellation_details: { comment: this.inAppCancellationComment },
      });
    }
    return await this.planService.switchToFreePlan(organizationId, id);
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case WEBHOOK_EVENTS.paymentIntentSucceeded:
        // log for audit
        break;
      case WEBHOOK_EVENTS.paymentIntentCanceled:
        // log for audit
        break;
      case WEBHOOK_EVENTS.paymentIntentPaymentFailed:
        // log for audit
        break;
      case WEBHOOK_EVENTS.paymentMethodAttached:
        // log for audit
        break;
      case WEBHOOK_EVENTS.checkoutSessionCompleted:
        const session = event.data.object;
        const userId = parseInt(session.metadata.userId);
        const newPlanId = parseInt(session.metadata.newPlanId);
        const organizationId = parseInt(session.metadata.organizationId);
        if (userId && newPlanId && organizationId) {
          if (session.mode === 'subscription') {
            // create the subscription
            const { subscription } = session;
            const subscriptionId =
              typeof subscription === 'string' ? subscription : subscription.id;
            const customerId =
              typeof session.customer === 'string'
                ? session.customer
                : session.customer.id;

            // subscription payment
            await this.planService.changePlanForOrganization(
              newPlanId,
              subscriptionId,
              organizationId,
              userId,
            );

            await this.subscriptionService.createSubscription(
              newPlanId,
              organizationId,
              userId,
              subscriptionId,
              customerId,
              this.isProd,
            );
          }
        } else if (userId && organizationId && session.mode === 'payment') {
          // addon payment
          const { messages, storage, users } = session.metadata;
          await this.planService.updateAddonForOrganization(
            {
              extraMessages: Number(messages),
              extraUsers: Number(users),
              extraStorage: Number(storage),
            },
            {
              organizationId: organizationId,
              incrementValues: true,
            },
          );
        }
        // log for audit
        break;
      case WEBHOOK_EVENTS.subscriptionPaused:
        await this.subscriptionService.pauseSubscription(event.data.object.id);
        // log for audit
        break;
      case WEBHOOK_EVENTS.subscriptionDeleted:
        const {
          id,
          cancellation_details: { comment },
        } = event.data.object;
        const cancelled =
          await this.subscriptionService.getSubscriptionById(id);
        if (cancelled && comment !== this.inAppCancellationComment) {
          await this.planService.switchToFreePlan(
            cancelled.organization_id,
            cancelled.stripe_subscription_id,
          );
        }
        // log for audit
        break;
      case WEBHOOK_EVENTS.subscriptionUpdated:
        const { object: sub, previous_attributes: prev } = event.data;
        const newPriceId = this.planChanged(prev, sub);

        if (newPriceId) {
          // switched to a new plan
          await this.subscriptionService.onSubscriptionPlanChange(
            sub.id,
            newPriceId,
          );
        }
        // log for audit
        break;
      case WEBHOOK_EVENTS.invoicePaymentSucceeded:
        // log for audit
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private planChanged(
    oldValue: Partial<Stripe.Subscription>,
    newValue: Stripe.Subscription,
  ) {
    if (!('plan' in oldValue) || !('plan' in newValue)) {
      return false;
    }

    const oldPlan = oldValue.plan as Stripe.Plan;
    const newPlan = newValue.plan as Stripe.Plan;

    return oldPlan.id !== newPlan.id ? newPlan.id : false;
  }

  get priceIdPath() {
    return this.isProd ? 'stripe_price_id' : 'sandbox_stripe_price_id';
  }
}
