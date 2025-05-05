export const WEBHOOK_EVENTS = {
  paymentIntentSucceeded: 'payment_intent.succeeded',
  paymentIntentCanceled: 'payment_intent.canceled',
  paymentIntentPaymentFailed: 'payment_intent.payment_failed',
  paymentMethodAttached: 'payment_method.attached',
  checkoutSessionCompleted: 'checkout.session.completed',
  invoicePaymentSucceeded: 'invoice.payment_succeeded',
  subscriptionCreated: 'customer.subscription.created',
  subscriptionPaused: 'customer.subscription.paused',
  subscriptionResumed: 'customer.subscription.resumed',
  subscriptionDeleted: 'customer.subscription.deleted',
  subscriptionUpdated: 'customer.subscription.updated',
} as const;
