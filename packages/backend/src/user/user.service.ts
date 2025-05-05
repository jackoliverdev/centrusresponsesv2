import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DBService } from '@/db/db.service';

import { handleDBValidationError } from '@/utils/errors';
import { UserProfileColumn, UserWithOrganizationFromDB } from '@/db/db.schema';
import {
  ChangeMemberRoleInOrganizationDto,
  OrganizationSchema,
  PaginateUsersParams,
  PLATFORM_ADMIN_ORG,
  TagItemData,
  UpdateUserDto,
  USER_ROLES,
  UserSchema,
  UserWithOrganizationSchema,
} from 'common';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';
import { VectorStoreService } from '@/vector-store/vector-store.service';
import { TagService } from '@/tag/tag.service';
import { transformPlan } from '@/plan/plan.util';
import { uniqBy } from 'lodash';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private dbService: DBService,
    private firebaseAuthService: FirebaseAuthService,
    private vectorStoreService: VectorStoreService,
    @Inject(forwardRef(() => TagService))
    private tagService: TagService,
  ) {}

  async getUserWithOrganizations(
    id: number,
    email?: string,
    firebaseUid?: string,
  ): Promise<UserWithOrganizationSchema> {
    const sql = this.dbService.sql;
    try {
      const [user] = await sql`
        WITH
          user_data AS (
            SELECT
              u.id,
              u.email,
              u.first_name,
              u.last_name,
              u.created_at,
              u.firebase_uid,
              u.active_organization_id,
              u.profile,
              u.image,
              u.is_teamleader,
              u.teamlead_id,
              u.phone,
              u.ai_user_context,
              u.ai_user_model,
              u.ai_user_temperature,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id',
                    o.id,
                    'name',
                    o.name,
                    'role',
                    uo.role,
                    'ai_context',
                    o.ai_context,
                    'ai_model',
                    o.ai_model,
                    'ai_temperature',
                    o.ai_temperature,
                    'active_organization_id',
                    u.active_organization_id,
                    'profile',
                    u.profile,
                    'image',
                    image,
                    'plan',
                    json_build_object(
                      'id',
                      p.id,
                      'name',
                      p.name,
                      'message_limit',
                      p.message_limit,
                      'storage_limit',
                      p.storage_limit,
                      'user_limit',
                      p.user_limit,
                      'custom_integrations',
                      p.custom_integrations,
                      'priority_support',
                      p.priority_support,
                      'addons',
                      p.addons,
                      'annual_discount',
                      p.annual_discount,
                      'price',
                      p.price,
                      'duration',
                      p.duration,
                      'slug',
                      p.slug,
                      'unit_size',
                      p.unit_size
                    )
                  )
                ) FILTER (
                  WHERE
                    o.id IS NOT NULL
                ),
                '[]'
              ) AS organizations,
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
                    t.deleted_at
                  )
                ) FILTER (
                  WHERE
                    t.deleted_at IS NULL AND ut.user_id = u.id
                ),
                '[]'
              ) AS tags
            FROM
              users u
              LEFT JOIN user_organizations uo ON u.id = uo.user_id
              LEFT JOIN organizations o ON uo.organization_id = o.id
              LEFT JOIN plans p ON o.plan_id = p.id
              LEFT JOIN user_tags ut ON ut.user_id = u.id
              LEFT JOIN tags t ON t.id = ut.tag_id
            WHERE
              ${firebaseUid
          ? sql`u.firebase_uid = ${firebaseUid}`
          : email
            ? sql`u.email = ${email.toLowerCase()}`
            : sql`u.id = ${id}`}
            GROUP BY
              u.id
          )
        SELECT
          *
        FROM
          user_data;
      `;

      if (!user) return null;

      // Validate the data against the schema
      const validatedUser = UserWithOrganizationFromDB.parse(user);
      const userProfile = validatedUser && validatedUser.profile;

      const validatedUserProfile = UserProfileColumn.parse(
        userProfile ? JSON.parse(userProfile) : {},
      );

      const { id: organizationId, role } = user.organizations.find(
        (o) => o.id != PLATFORM_ADMIN_ORG.organizationId,
      );

      return {
        id: validatedUser.id,
        email: validatedUser.email,
        firstName: validatedUser.first_name,
        lastName: validatedUser.last_name,
        firebaseUid: validatedUser.firebase_uid,
        image: validatedUser.image,
        organizations: validatedUser.organizations.map((o) => ({
          id: o.id,
          name: o.name,
          role: o.role,
          plan: o.plan ? transformPlan(o.plan) : undefined,
        })),
        activeOrganizationId: validatedUser.active_organization_id,
        tags: uniqBy(validatedUser.tags, 'id').map((tag) => ({
          id: tag.id,
          name: tag.name,
          createdAt: tag.created_at,
          deletedAt: tag.deleted_at,
          backgroundColor: tag.background_color,
          textColor: tag.text_color,
          organizationId: tag.organization_id,
          userId: tag.user_id,
        })),
        is_teamleader: validatedUser.is_teamleader,
        teamlead_id: validatedUser.teamlead_id,
        phone: validatedUser.phone,
        aiUserContext: validatedUser.ai_user_context,
        profile: validatedUserProfile,
        organizationId,
        role,
        ai_user_model: validatedUser.ai_user_model,
        ai_user_temperature: validatedUser.ai_user_temperature,
      } as UserWithOrganizationSchema;
    } catch (error) {
      handleDBValidationError(
        error,
        this.logger,
        `Data validation failed for user ${id}`,
        { id, email, firebaseUid },
      );
    }
  }

  async createUserInDatabase({
    firebaseUid,
    email,
    organizationId,
    firstName,
    lastName,
    profile,
    tags,
    is_teamleader,
    phone,
    isAdmin,
    image,
    ai_user_model,
    ai_user_temperature,
  }: {
    firebaseUid: string;
    email: string;
    organizationId: number;
    firstName?: string;
    lastName?: string;
    profile?: UserSchema['profile'];
    phone?: string;
    tags?: TagItemData[];
    is_teamleader?: boolean;
    isAdmin?: boolean;
    image?: string;
    ai_user_model?: string;
    ai_user_temperature?: number;
  }): Promise<any> {
    const sql = this.dbService.sql;
    // Use a transaction to ensure all operations succeed or fail together
    const { user, organization } = await sql.begin(async (sql) => {
      // Create a new user in the database
      const [user] = await sql`
        INSERT INTO
          users (
            firebase_uid,
            email,
            first_name,
            last_name,
            image,
            phone,
            profile,
            is_teamleader,
            ai_user_model,
            ai_user_temperature
          )
        VALUES
          (
            ${firebaseUid},
            ${email.toLowerCase()},
            ${firstName ?? ''},
            ${lastName ?? ''},
            ${image ?? ''},
            ${phone ?? null},
            ${profile ? JSON.stringify(profile) : null},
            ${is_teamleader ? is_teamleader : false},
            ${ai_user_model ?? null},
            ${typeof ai_user_temperature !== 'undefined' ? ai_user_temperature : 0.5}
          )
        RETURNING
          *
      `;

      const [organization] = await sql`
        SELECT
          *
        FROM
          organizations
        WHERE
          id = ${organizationId}
      `;
      // Associate the user with the organization
      await sql`
        INSERT INTO
          user_organizations (user_id, organization_id, role)
        VALUES
          (
            ${user.id},
            ${organizationId},
            ${isAdmin ? 'admin' : 'user'}
          )
      `;

      if (tags?.length > 0) {
        const filteredTags = await this.tagService.processNewTags(
          organizationId,
          tags,
        );
        // Associate the user with the tags
        await sql`
          INSERT INTO
            user_tags ${sql(
            filteredTags.map((tag) => ({ user_id: user.id, tag_id: tag.id })),
          )}
        `;
      }

      return { user, organization };
    });

    if (tags) {
      for (const tag of tags) {
        await this.vectorStoreService.create(tag.id, organizationId);
      }
    }
    return { user, organization };
  }

  async updateUserInDatabase(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.getUserWithOrganizations(id);
    const filteredTags = await this.tagService.processNewTags(
      user.organizationId,
      updateUserDto.tags ?? user.tags,
    );

    if (filteredTags.length > 0) {
      await Promise.all(
        filteredTags.map((tag) =>
          this.vectorStoreService.get(tag.id, user.organizationId),
        ),
      );
    }

    const isUserAdmin =
      user.organizations.find((org) => org.id == user.organizationId)?.role ==
      USER_ROLES.admin;

    if (isUserAdmin && updateUserDto.isAdmin === false) {
      await this.changeMemberRoleInOrganization(user.organizationId, {
        role: USER_ROLES.user,
        userId: id,
      });
    }

    if (!isUserAdmin && updateUserDto.isAdmin === true) {
      await this.changeMemberRoleInOrganization(user.organizationId, {
        role: USER_ROLES.admin,
        userId: id,
      });
    }

    const { teamMemberIds: newTeamMemberIds } = updateUserDto;
    if (user.is_teamleader && newTeamMemberIds) {
      const teamMembers = await this.getTeamMembers(id);
      const teamMemberIds = teamMembers.map((member) => member.id);
      const added = newTeamMemberIds.filter(
        (id) => !teamMemberIds.includes(id),
      );
      const removed = teamMemberIds.filter(
        (id) => !newTeamMemberIds.includes(id),
      );
      await this.setTeamLead(removed, null);
      await this.setTeamLead(added, id);
    }

    const sql = this.dbService.sql;
    try {
      const tags = filteredTags.map((tag) => ({
        user_id: user.id,
        tag_id: tag.id,
      }));

      return await sql.begin(async (trx) => {
        const [updatedUser] = await trx`
            UPDATE users
            SET first_name             = ${updateUserDto.firstName ?? trx`first_name`},
                last_name              = ${updateUserDto.lastName ?? trx`last_name`},
                firebase_uid           = ${updateUserDto.firebaseUid ?? trx` firebase_uid `},
                image                  = ${updateUserDto.image ?? trx`image`},
                teamlead_id            = ${
                  typeof updateUserDto.teamlead_id == 'undefined'
                    ? trx`teamlead_id`
                    : updateUserDto.teamlead_id
                },
                is_teamleader          = ${
                  updateUserDto.is_teamleader ?? trx`is_teamleader`
                },
                phone                  = ${
                  typeof updateUserDto.phone != 'undefined' &&
                  updateUserDto.phone != ''
                    ? updateUserDto.phone
                    : trx`phone`
                },
                active_organization_id = ${
                  updateUserDto.activeOrganizationId ??
                  trx`active_organization_id`
                },
                profile                = ${
                  updateUserDto.profile
                    ? JSON.stringify(updateUserDto.profile)
                    : trx`profile`
                },
                ai_user_model          = ${typeof updateUserDto.ai_user_model !== 'undefined' ? updateUserDto.ai_user_model : trx`ai_user_model`},
                ai_user_temperature    = ${typeof updateUserDto.ai_user_temperature !== 'undefined' ? updateUserDto.ai_user_temperature : trx`ai_user_temperature`}
            WHERE id = ${id}
            RETURNING
                *
        `;
        if (!updatedUser) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }

        await trx`DELETE
                  FROM user_tags
                  where user_id = ${user.id}`;

        if (filteredTags.length > 0) {
          await trx`INSERT INTO user_tags ${sql(tags)} RETURNING *`;
        }

        return updatedUser;
      });
    } catch (error) {
      throw new Error(`Failed to update user: ${(error as any).message}`);
    }
  }

  async findUserByPhone(phone: string) {
    return this.findUserBy('phone', phone);
  }

  async findUserByEmail(email: string) {
    return this.findUserBy('email', email);
  }

  async findUserBy(key: string, value: string | number) {
    const supabase = this.dbService.supabase;
    const { data } = await supabase
      .from('users')
      .select('*,userTags:user_tags(tag:tags(id,name))')
      .eq(key, value)
      .limit(1)
      .maybeSingle()
      .throwOnError();

    if (!data) {
      return null;
    }

    return { ...data, tags: data.userTags.map(({ tag }) => tag.name) };
  }

  async getTeamMembers(userId: number) {
    const supabase = this.dbService.supabase;
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, teamlead_id')
      .eq('teamlead_id', userId)
      .throwOnError();
    return data;
  }

  async setTeamLead(userIds: number[], teamLeadId: number | null) {
    await this.dbService.supabase
      .from('users')
      .update({ teamlead_id: teamLeadId })
      .in('id', userIds)
      .throwOnError();
  }

  async changeMemberRoleInOrganization(
    organizationId: OrganizationSchema['id'],
    changeMemberRoleInOrganizationDto: ChangeMemberRoleInOrganizationDto,
  ) {
    const sql = this.dbService.sql;
    try {
      if (changeMemberRoleInOrganizationDto.role === USER_ROLES.owner) {
        await sql`
          UPDATE user_organizations
          SET ROLE = ${USER_ROLES.admin}
          WHERE
            role = ${USER_ROLES.owner}
            AND organization_id = ${organizationId}
          RETURNING
            *
        `;
      }
      const [updatedMember] = await sql`
        UPDATE user_organizations
        SET ROLE = ${changeMemberRoleInOrganizationDto.role}
        WHERE
          user_id = ${changeMemberRoleInOrganizationDto.userId}
          AND organization_id = ${organizationId}
        RETURNING
          *
      `;

      if (!updatedMember) {
        throw new NotFoundException(
          `Failed to change user ID ${changeMemberRoleInOrganizationDto.userId} role to ${changeMemberRoleInOrganizationDto.role}`,
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to change user ID ${changeMemberRoleInOrganizationDto.userId} role to ${changeMemberRoleInOrganizationDto.role}: ${(error as any).message}`,
      );
    }
  }

  async deleteUser(id: number) {
    const supabase = this.dbService.supabase;
    const user = await this.getUserWithOrganizations(id);
    await supabase.from('users').delete().eq('id', id).throwOnError();
    try {
      await this.firebaseAuthService.deleteUser(user.firebaseUid);
    } catch {}
  }

  async getUsers(options: PaginateUsersParams) {
    const paginated = await this.dbService.paginate<
      'users',
      {
        id: number;
        email: string;
        created_at: string;
        firstName: string;
        lastName: string | null;
        roles: { role: string }[];
        organizations: { id: number; name: string }[];
      }
    >({
      table: 'users',
      ...options,
      selectQuery:
        'id,email,created_at,firstName:first_name,lastName:last_name, roles:user_organizations(role), organizations:organizations(id, name),userTags:user_tags(tag:tags(id,name,backgroundColor:background_color,textColor:text_color))',
    });

    return {
      ...paginated,
      data: paginated.data.map(({ roles, organizations, ...user }) => ({
        ...user,
        role: roles[0].role,
        organization: organizations.find(
          (org) => org.id !== PLATFORM_ADMIN_ORG.organizationId,
        ),
      })),
    };
  }

  async usage(organizationId: number) {
    const { count } = await this.dbService.supabase
      .from('user_organizations')
      .select('user_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .throwOnError();

    return count;
  }

  async updateUserAIContext(userId: number, aiUserContext: string) {
    const sql = this.dbService.sql;
    try {
      const [updatedUser] = await sql`
        UPDATE users
        SET ai_user_context = ${aiUserContext}
        WHERE id = ${userId}
        RETURNING *
      `;
      
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      return updatedUser;
    } catch (error) {
      throw new Error(`Failed to update user AI context: ${(error as any).message}`);
    }
  }
}
