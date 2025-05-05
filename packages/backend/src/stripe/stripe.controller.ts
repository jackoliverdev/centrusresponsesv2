import { Controller, Post, Body, Req, Res, Headers } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { API, USER_ROLES } from 'common';
import { Authorized } from '@/auth-guard/auth-guard';
import { OrganizationId, User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';

@Controller()
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post(API.stripeCheckoutPlan.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async createCheckoutPlan(
    @User() { email, userId, organizationId }: UserFromRequest,
    @Body()
    {
      newPlanId,
    }: ReturnType<typeof API.stripeCheckoutPlan.getTypedRequestBody>,
  ) {
    return this.stripeService.createCheckoutPlan({
      email,
      userId,
      newPlanId,
      organizationId,
    });
  }

  @Post(API.stripeCheckoutPlanAddons.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async createCheckoutPlanAddon(
    @User() { email, userId, organizationId }: UserFromRequest,
    @Body()
    {
      quantities,
    }: ReturnType<typeof API.stripeCheckoutPlanAddons.getTypedRequestBody>,
  ) {
    return this.stripeService.createCheckoutPlanAddons({
      email,
      userId,
      organizationId,
      quantities,
    });
  }

  @Post(API.stripeCancelSubscription.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async stripeCancelSubscription(
    @OrganizationId() organizationId: number,
    @Body()
    {
      currentSubscriptionId,
    }: ReturnType<typeof API.stripeCancelSubscription.getTypedRequestBody>,
  ) {
    return this.stripeService.cancelSubscription(currentSubscriptionId, organizationId);
  }

  @Post(API.stripeWebhook.path)
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const event: Stripe.Event = this.stripeService[
        'stripe'
      ].webhooks.constructEvent(req.body, signature, webhookSecret);
      await this.stripeService.handleWebhookEvent(event);
      res.status(200).send('Success');
    } catch (err) {
      console.error(err);
      res.status(400).send(`Webhook Error: ${err}`);
    }
  }
}
