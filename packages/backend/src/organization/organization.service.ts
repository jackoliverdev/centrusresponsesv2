import {
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AddMemberToOrganizationDto,
  CreateOrganizationDto,
  DeleteMemberFromOrganizationDto,
  formatPlanStats,
  OrganizationMemberSchema,
  OrganizationPlanInfoSchema,
  OrganizationSchema,
  PaginateOrganizationsParams,
  PLATFORM_ADMIN_ORG,
  SignUpWithOrganizationDto,
  UserWithOrganizationSchema,
} from 'common';
import { DBService } from '@/db/db.service';
import {
  ModelSchema,
  PlanAddonRowType,
  PlanRowType,
  TagRow,
  TagRowType,
  UserOrganizationsRow,
  UserProfileColumn,
} from '@/db/db.schema';
import { TablesUpdate } from '@/utils/supabase.types';
import { z } from 'zod';
import { uniqBy } from 'lodash';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';
import { transformPlan, transformPlanAddon } from '@/plan/plan.util';

@Injectable()
export class OrganizationService {
  constructor(
    private dbService: DBService,
    private firebaseAuthService: FirebaseAuthService,
  ) {}

  async getOrganization(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    const tokenSchema = z
      .object({
        access_token: z.string(),
        refresh_token: z.string(),
        expiry_date: z.number(),
      })
      .nullable()
      .default(null);
    type TokenType = {
      access_token: string;
      refresh_token: string;
      expiry_date: number;
    } | null;

    const google_token = tokenSchema.parse(data.google_token) as TokenType;
    const microsoft_token = tokenSchema.parse(
      data.microsoft_token,
    ) as TokenType;
    const ai_model = this.parseModel(data.ai_model);

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', data.plan_id)
      .single();

    const { data: customPlan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', data.custom_plan_id)
      .single();

    let addon: PlanAddonRowType;

    if (data.addon_id) {
      const { data: addonData } = await supabase
        .from('plan_addons')
        .select('*')
        .eq('id', data.addon_id)
        .single();

      addon = addonData;
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('organization_id', organizationId)
      .eq('plan_id', plan.id)
      .maybeSingle();

    return {
      ...data,
      google_token,
      microsoft_token,
      ai_model,
      plan: transformPlan(plan),
      addon: plan.addons && addon ? transformPlanAddon(addon) : null,
      subscriptionStatus: subscription?.status ?? 'active',
      usageLimits: this.usageLimits(plan, customPlan, addon),
    };
  }

  async getOrganizations({ filters, ...options }: PaginateOrganizationsParams) {
    const paginated = await this.dbService.paginate<'organizations', object>({
      table: 'organizations',
      ...options,
      selectQuery: 'id, name, created_at',
      filters: [
        {
          key: 'id',
          operator: 'neq',
          value: PLATFORM_ADMIN_ORG.organizationId,
        },
        ...(filters ?? []),
      ],
    });

    const stats: Record<number, OrganizationPlanInfoSchema> = {};

    if (paginated.data.length > 0) {
      await Promise.all(
        paginated.data.map(async (organization) => {
          stats[organization.id] = await this.getOrganizationPlanInfo(
            organization.id,
          );
        }),
      );
    }

    return {
      ...paginated,
      data: paginated.data.map(({ ...organization }) => {
        const stat = stats[organization.id];
        return {
          ...organization,
          plan: {
            id: stat.plan.id,
            name: stat.plan.name,
            slug: stat.plan.slug,
            duration: stat.plan.duration,
            messageLimit: stat.plan.messageLimit,
            storageLimit: stat.plan.storageLimit,
            userLimit: stat.plan.userLimit,
          },
          addon: stat.plan.addons ? stat.addon : undefined,
          usages: stat.usages,
          usageLimits: stat.usageLimits,
          documentCount: stat.documentCount,
          formattedStats: stat.formattedStats,
          subscriptionId: stat.subscriptionId,
        };
      }),
    };
  }

  async getStats() {
    const supabase = this.dbService.supabase;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date(sevenDaysAgo);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);

    // Get the first day of the current month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    // Get the last day of the current month
    const lastDayOfMonth = new Date();
    lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
    lastDayOfMonth.setDate(0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const [
      { count: organizations },
      { count: users },
      { count: messages },
      { count: previousMessages },
      { data: docs },
    ] = await Promise.all([
      this.getTotalOrganizations(),
      this.getTotalUsers(),
      this.getTotalMessages()
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString()),
      this.getTotalMessages()
        .gte('created_at', sevenDaysAgo.toISOString())
        .lt('created_at', new Date().toISOString()),
      supabase.from('documents').select('size.sum()').limit(1).maybeSingle(),
    ]);

    return {
      organizations,
      users,
      messages,
      previousMessages,
      // @ts-expect-error false positive
      storage: docs.sum ?? 0,
    };
  }

  getTotalOrganizations(organizationId?: number) {
    const supabase = this.dbService.supabase;

    const queryBuilder = supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true });

    if (organizationId) {
      return queryBuilder.eq('id', organizationId);
    }

    return queryBuilder.neq('id', PLATFORM_ADMIN_ORG.organizationId);
  }

  getTotalUsers(organizationId?: number) {
    const supabase = this.dbService.supabase;

    const queryBuilder = supabase
      .from('user_organizations')
      .select('user_id', { count: 'exact', head: true });

    if (organizationId) {
      return queryBuilder.eq('organization_id', organizationId);
    }

    return queryBuilder.neq(
      'organization_id',
      PLATFORM_ADMIN_ORG.organizationId,
    );
  }

  getTotalMessages(organizationId?: number) {
    const supabase = this.dbService.supabase;

    // Get the first day of the current month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    // Get the last day of the current month
    const lastDayOfMonth = new Date();
    lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
    lastDayOfMonth.setDate(0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const queryBuilder = supabase
      .from('message_stats')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', lastDayOfMonth.toISOString());

    if (organizationId) {
      return queryBuilder.eq('organization_id', organizationId);
    }

    return queryBuilder.neq(
      'organization_id',
      PLATFORM_ADMIN_ORG.organizationId,
    );
  }

  async getOrganizationPlanInfo(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', organization.plan_id)
      .single();

    const { data: customPlan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', organization.custom_plan_id)
      .single();

    let addon: PlanAddonRowType;

    if (organization.addon_id) {
      const { data: addonData } = await supabase
        .from('plan_addons')
        .select('*')
        .eq('id', organization.addon_id)
        .single();

      addon = addonData;
    }

    const [
      { data: subscription },
      { count: users },
      { count: messages },
      { data: storage, count },
    ] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('status,stripe_subscription_id')
        .eq('organization_id', organizationId)
        .eq('plan_id', plan.id)
        .eq('status', 'active')
        .maybeSingle(),
      this.getTotalUsers(organizationId),
      this.getTotalMessages(organizationId),
      supabase
        .from('documents')
        .select('size.sum()', { count: 'exact' })
        .eq('organization_id', organizationId)
        .limit(1)
        .single()
        .throwOnError(),
    ]);

    const usageLimits = this.usageLimits(plan, customPlan, addon);

    const usages = {
      messages,
      // @ts-expect-error false positive
      storage: storage.sum ?? 0,
      users,
    };

    const formattedStats = formatPlanStats({ usageLimits, usages });

    return {
      plan: transformPlan(plan),
      addon: plan.addons && addon ? transformPlanAddon(addon) : null,
      subscriptionStatus: subscription?.status ?? 'active',
      subscriptionId: subscription?.stripe_subscription_id,
      usageLimits,
      usages,
      formattedStats,
      documentCount: count,
    };
  }

  async getFlatOrganization(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()
      .throwOnError();

    return organization;
  }

  async getUserOrganization(userId: number, organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data: userOrganization } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single()
      .throwOnError();

    return userOrganization;
  }

  async getMicrosoftToken(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data } = await supabase
      .from('organizations')
      .select('microsoft_token')
      .eq('id', organizationId)
      .limit(1)
      .single();

    return z
      .object({
        access_token: z.string(),
        refresh_token: z.string(),
        expiry_date: z.number(),
      })
      .nullable()
      .parse(data.microsoft_token);
  }

  async getMembers(
    organizationId: number,
  ): Promise<OrganizationMemberSchema[]> {
    const sql = this.dbService.sql;
    try {
      const orgMembers = await sql`
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.profile,
          u.image,
          u.created_at,
          u.firebase_uid,
          u.is_teamleader,
          u.teamlead_id,
          u.phone,
          uo.role,
          COALESCE(
            json_agg(
              json_build_object(
                'id',
                t.id,
                'name',
                t.name,
                'background_color',
                t.background_color,
                'text_color',
                t.text_color,
                'organization_id',
                t.organization_id,
                'user_id',
                ut.user_id,
                'created_at',
                t.created_at,
                'deleted_at',
                t.deleted_at,
                'context',
                t.context
              )
            ) FILTER (
              WHERE
              t.deleted_at IS NULL AND ut.user_id = u.id
            ),
            '[]'
          ) AS tags,
          CAST(COUNT(ms.id) AS Integer) AS chat_count
        FROM
          users u
          JOIN user_organizations uo ON u.id = uo.user_id
          JOIN organizations o ON uo.organization_id = o.id
          LEFT JOIN message_stats ms ON u.id = ms.user_id AND o.id = ms.organization_id
          LEFT JOIN user_tags ut ON ut.user_id = u.id
          LEFT JOIN tags t ON t.id = ut.tag_id
        WHERE
          o.id = ${organizationId}
        GROUP BY
          u.id,
          uo.role
        ORDER BY
          u.id
      `;

      return orgMembers.map((orgMember) => {
        const memberProfile = orgMember.profile;
        const validatedMemberProfile = UserProfileColumn.parse(
          memberProfile ? JSON.parse(memberProfile) : {},
        );
        const tags: TagRowType[] = orgMember.tags?.map(TagRow.parse) ?? [];

        return {
          id: orgMember.id,
          email: orgMember.email,
          firstName: orgMember.first_name,
          lastName: orgMember.last_name,
          image: orgMember.image,
          profile: validatedMemberProfile,
          firebaseUid: orgMember.firebase_uid,
          is_teamleader: orgMember.is_teamleader,
          tags: uniqBy(tags, 'id').filter(t => t.user_id === orgMember.id).map((tag) => ({
            id: tag.id,
            name: tag.name,
            createdAt: tag.created_at,
            deletedAt: tag.deleted_at,
            backgroundColor: tag.background_color,
            textColor: tag.text_color,
            organizationId: tag.organization_id,
            userId: tag.user_id,
          })),
          teamlead_id: orgMember.teamlead_id,
          phone: orgMember.phone,
          role: UserOrganizationsRow.shape.role.parse(orgMember.role),
          chat_count: orgMember.chat_count,
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to get users for organization ID ${organizationId}: ${(error as Error).message}`,
      );
    }
  }

  createAssistantInstructions(instructions: string) {
    const privateContext =
      "You're a helpful assistant, and you only reply when you know the answer. You also follow the following system prompt:";
    return `${privateContext} ${instructions}`;
  }

  async updateOrganization(
    organizationId: OrganizationSchema['id'],
    dto: TablesUpdate<'organizations'>,
  ) {
    const {
      ai_model: oldModel,
      ai_context: oldContext,
      ai_temperature: oldTemperature,
    } = await this.getOrganization(organizationId);
    const {
      ai_model: newModel,
      ai_context: newContext,
      ai_temperature: newTemperature,
      google_client_id,
      google_client_secret,
      microsoft_client_id,
      microsoft_client_secret,
      teams_bot_url,
      whatsapp_number,
    } = dto;

    const supabase = this.dbService.supabase;
    await supabase
      .from('organizations')
      .update(dto)
      .eq('id', organizationId)
      .throwOnError();
  }

  async addMemberToOrganization(
    organizationId: OrganizationSchema['id'],
    addMemberToOrganizationDto: AddMemberToOrganizationDto,
  ) {
    const sql = this.dbService.sql;
    try {
      await sql`
        INSERT INTO
          user_organizations (user_id, organization_id, role)
        VALUES
          (
            ${addMemberToOrganizationDto.userId},
            ${organizationId},
            ${addMemberToOrganizationDto.role}
          )
      `;
    } catch (error) {
      throw new Error(
        `Failed to add user ${addMemberToOrganizationDto.userId} to organization ${organizationId}: ${(error as any).message}`,
      );
    }
  }

  async deleteMemberFromOrganization(
    organizationId: OrganizationSchema['id'],
    deleteMemberFromOrganizationDto: DeleteMemberFromOrganizationDto,
  ) {
    const sql = this.dbService.sql;
    try {
      const [deletedMember] = await sql`
        DELETE FROM user_organizations
        WHERE
          user_id = ${deleteMemberFromOrganizationDto.userId}
          AND organization_id = ${organizationId}
        RETURNING
          *
      `;

      if (!deletedMember) {
        throw new NotFoundException(
          `Failed to delete user ID ${deleteMemberFromOrganizationDto.userId} from organization ID ${organizationId}`,
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to delete user ID ${deleteMemberFromOrganizationDto.userId} from organization ID ${organizationId}: ${(error as any).message}`,
      );
    }
  }

  async deleteOrganization(organizationId: OrganizationSchema['id']) {
    const sql = this.dbService.sql;
    try {
      const [deletedOrganization] = await sql`
        DELETE FROM organizations
        WHERE
          id = ${organizationId}
        RETURNING
          *
      `;
      // TODO: Fix cascade on user_organizations

      if (!deletedOrganization) {
        throw new NotFoundException(
          `Failed to delete organization ID ${organizationId}`,
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to delete organization ID ${organizationId}: ${(error as any).message}`,
      );
    }
  }

  async createOrganization(createOrganizationDto: CreateOrganizationDto) {
    const sql = this.dbService.sql;
    try {
      await sql`
        INSERT INTO
          organizations (name)
        VALUES
          (${createOrganizationDto.name})
      `;
    } catch (error) {
      throw new Error(
        `Failed to create organization: ${(error as any).message}`,
      );
    }
  }

  async signUpWithOrganization(
    signUpDto: SignUpWithOrganizationDto,
  ): Promise<UserWithOrganizationSchema> {
    const sql = this.dbService.sql;
    const ADMIN_ROLE = 'admin' as const;

    const firebaseUser = await this.firebaseAuthService.createUser(
      signUpDto.user.email,
      signUpDto.user.password,
    );

    try {
      return await sql.begin(async (sql) => {
        // get free plan
        const [freePlan] = await sql<[PlanRowType?]>`
          SELECT
            *
          FROM
            plans
          WHERE
            slug = 'free'
          LIMIT
            1;
        `;

        if (!freePlan) {
          throw new NotFoundException('Free plan not found');
        }

        // Create organization
        const [organization] = await sql<[OrganizationSchema?]>`
          INSERT INTO
            organizations (
              name,
              ai_model,
              ai_context,
              ai_temperature,
              plan_id
            )
          VALUES
            (
              ${signUpDto.organization.name},
              'gpt-4.1',
              'You are Centrus, an AI assistant designed to enhance workplace efficiency by addressing employee inquiries, resolving issues promptly, and facilitating requests. Your goal is to provide precise and supportive assistance, actively listening to users, comprehending their needs, and delivering relevant information or guiding them to appropriate solutions. If a query is unclear, seek clarification to ensure accurate responses. Conclude interactions positively, ensuring users feel empowered and informed.',
              0.5,
              ${freePlan.id}
            )
          RETURNING
            *
        `;

        if (!organization) {
          throw new Error('Failed to create organization');
        }

        // Create user
        const [user] = await sql`
          INSERT INTO
            users (
              email,
              first_name,
              last_name,
              firebase_uid,
              active_organization_id,
              image,
              tags,
              is_teamleader,
              teamlead_id,
              phone,
              profile
            )
          VALUES
            (
              ${signUpDto.user.email.toLowerCase()},
              ${signUpDto.user.firstName || ''},
              ${signUpDto.user.lastName || ''},
              ${firebaseUser.uid},
              ${organization.id},
              '',
              ARRAY[]::TEXT[],
              FALSE,
              NULL,
              NULL,
              '{}'::jsonb
            )
          RETURNING
            *
        `;

        if (!user) {
          throw new Error('Failed to create user');
        }

        await sql`
          INSERT INTO
            user_organizations (user_id, organization_id, role)
          VALUES
            (
              ${user.id},
              ${organization.id},
              ${ADMIN_ROLE}
            )
        `;

        return {
          id: user.id,
          email: user.email,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          firebaseUid: user.firebase_uid,
          image: user.image || '',
          profile: {},
          organizations: [
            {
              ...organization,
              role: ADMIN_ROLE,
              plan: transformPlan(freePlan),
              currentUsage: {
                messagesUsed: 0,
                storageUsedMb: 0,
                activeUsers: 1,
              },
            },
          ],
          activeOrganizationId: organization.id,
          organizationId: organization.id,
          role: ADMIN_ROLE,
          tags: [],
          is_teamleader: false,
          teamlead_id: null,
          phone: null,
        };
      });
    } catch (error) {
      await this.firebaseAuthService.deleteUser(firebaseUser.uid);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new Error(
        `Failed to create organization and user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private parseModel(model: string) {
    return ModelSchema.parse(model);
  }

  usageLimits(
    plan: Partial<PlanRowType>,
    customPlan?: Partial<PlanRowType>,
    addon?: PlanAddonRowType,
  ) {
    const limits = {
      messages: 0, // quota + addons
      storage: 0, // quota + addons
      users: 0, // quota + addons
      messageQuota: 0,
      storageQuota: 0,
      userQuota: 0,
      messageAddons: 0,
      storageAddons: 0,
      userAddons: 0,
    };

    if (!plan) {
      return limits;
    }

    // whichever value is higher, between plan limits and custom set limits.
    limits.messages = limits.messageQuota = Math.max(
      plan.message_limit ?? 0,
      customPlan?.message_limit ?? 0,
    );
    limits.storage = limits.storageQuota = Math.max(
      plan.storage_limit ?? 0,
      customPlan?.storage_limit ?? 0,
    );
    limits.users = limits.userQuota = Math.max(
      plan.user_limit ?? 0,
      customPlan?.user_limit ?? 0,
    );

    if (plan.addons && addon) {
      limits.messages += addon.extra_messages;
      limits.storage += addon.extra_storage;
      limits.users += addon.extra_users;

      limits.messageAddons = addon.extra_messages;
      limits.storageAddons = addon.extra_storage;
      limits.userAddons = addon.extra_users;
    }

    return limits;
  }

  async usageLimitsForOrganization(organizationId: number) {
    const { usageLimits } = await this.getOrganizationPlanInfo(organizationId);

    return usageLimits;
  }

  async updateSuggestedTagContext(
    organizationId: number,
    suggested_tag_context: string
  ) {
    const supabase = this.dbService.supabase;
    await supabase
      .from('organizations')
      .update({ suggested_tag_context })
      .eq('id', organizationId)
      .throwOnError();
  }
}
