import { PlanAddonRow, PlanAddonRowType, PlanRow, PlanRowType } from '@/db/db.schema';
import { PlanAddonSchema, PlanSchema } from 'common';

export const transformPlan = (planRow: PlanRowType): PlanSchema => {
  const parsed = PlanRow.parse(planRow)
  return {
    id: parsed.id,
    annualDiscount: parsed.annual_discount,
    customIntegrations: parsed.custom_integrations,
    duration: parsed.duration,
    messageLimit: parsed.message_limit,
    userLimit: parsed.user_limit,
    name: parsed.name,
    prioritySupport: parsed.priority_support,
    storageLimit: parsed.storage_limit,
    addons: parsed.addons,
    price: parsed.price,
    stripePriceId: parsed.stripe_price_id,
    sandboxStripePriceId: parsed.sandbox_stripe_price_id,
    slug: parsed.slug,
    unitSize: parsed.unit_size,
  }
}

export const transformPlanAddon = (planAddonRow: PlanAddonRowType): PlanAddonSchema => {
  const parsed = PlanAddonRow.parse(planAddonRow)
  return {
    id: parsed.id,
    extraMessages: parsed.extra_messages,
    extraStorage: parsed.extra_storage,
    extraUsers: parsed.extra_users,
  }
}