import { z } from 'zod';
import { ALL_USER_ROLES } from 'common';
import OpenAI from 'openai';

// We accept any string for ai_model now (no enum enforcement)
export const ModelSchema = z.string();

export const UserProfileColumn = z.object({
  position: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export const TagRow = z.object({
  id: z.number(),
  name: z.string(),
  background_color: z.string(),
  text_color: z.string(),
  created_at: z.string(),
  deleted_at: z.string().nullable().optional(),
  organization_id: z.number(),
  user_id: z.number(),
  context: z.string().nullable().optional(),
});

export type TagRowType = z.infer<typeof TagRow>;

export const UsersRow = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  image: z.string(),
  firebase_uid: z.string(),
  active_organization_id: z.number().nullable().optional(),
  profile: z.string().nullable().optional(),
  is_teamleader: z.boolean(),
  teamlead_id: z.number().nullable(),
  tags: z.array(TagRow).optional().default([]),
  phone: z.string().nullable(),
  ai_user_context: z.string().nullable(),
  ai_user_model: z.string().nullable(),
  ai_user_temperature: z.number().nullable().optional(),
});

export type UsersRowType = z.infer<typeof UsersRow>;

export const PlanRow = z.object({
  id: z.number(),
  name: z.string(),
  active_organization_id: z.number().nullable().optional(),
  profile: z.string().nullable().optional(),
  custom_integrations: z.boolean(),
  priority_support: z.boolean(),
  addons: z.boolean(),
  annual_discount: z.number(),
  message_limit: z.coerce.number(),
  storage_limit: z.coerce.number(),
  user_limit: z.coerce.number(),
  unit_size: z.coerce.number(),
  price: z.number(),
  duration: z.enum(['monthly', 'annually', 'discounted']).nullable(),
  stripe_price_id: z.string().nullable().optional(),
  sandbox_stripe_price_id: z.string().nullable().optional(),
  slug: z
    .enum([
      'free',
      'small_team_monthly',
      'small_team_annually',
      'large_team_monthly',
      'large_team_annually',
      'enterprise',
      'addon_messages',
      'addon_storage',
      'addon_users',
      'custom',
    ])
    .nullable(),
});

export type PlanRowType = z.infer<typeof PlanRow>;

export const PlanAddonRow = z.object({
  id: z.number(),
  extra_messages: z.coerce.number(),
  extra_storage: z.coerce.number(),
  extra_users: z.coerce.number(),
});

export type PlanAddonRowType = z.infer<typeof PlanAddonRow>;

export const OrganizationsRow = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date().nullable().optional(),
  ai_model: ModelSchema,
  ai_context: z.string(),
  ai_temperature: z.number(),
  google_client_id: z.string(),
  google_client_secret: z.string(),
  microsoft_client_id: z.string(),
  microsoft_client_secret: z.string(),
  whatsapp_number: z.string(),
  suggested_tag_context: z.string().nullable().optional(),
  plan: PlanRow.optional(),
  customPlan: PlanRow.optional(),
});

export const UserOrganizationsRow = z.object({
  user_id: z.number(),
  organization_id: z.number(),
  role: z.enum(ALL_USER_ROLES),
});

const UserOrganizationInfoFromDB = OrganizationsRow.extend({
  role: UserOrganizationsRow.shape.role,
});

export const UserWithOrganizationFromDB = UsersRow.extend({
  organizations: z.array(
    UserOrganizationInfoFromDB.pick({
      id: true,
      role: true,
      name: true,
      plan: true,
    }),
  ),
  ai_user_model: z.string().nullable(),
  ai_user_temperature: z.number().nullable().optional(),
});

export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  path: z.string(),
  size: z.number(),
  drive_file_id: z.string().nullable(),
  teams_document: z.boolean(),
  tag: z.string(),
});
