import { Body, Controller, NotFoundException, Post } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { API, ResponseBodyType, USER_ROLES, UpdateSuggestedTagContextDto } from 'common';
import { OrganizationId, User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { Authorized } from '@/auth-guard/auth-guard';
import { UserService } from '@/user/user.service';
import { DBService } from '@/db/db.service';

@Controller()
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly dbService: DBService,
  ) {}

  @Post(API.signUpWithOrganization.path)
  async signUpWithOrganization(
    @Body()
    signUpDto: ReturnType<
      typeof API.signUpWithOrganization.getTypedRequestBody
    >,
  ): Promise<ResponseBodyType<typeof API.signUpWithOrganization>> {
    return this.organizationService.signUpWithOrganization(signUpDto);
  }

  @Post(API.getOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin, USER_ROLES.user] })
  async getOrganization(
    @OrganizationId()
    id: number,
  ): Promise<ResponseBodyType<typeof API.getOrganization>> {
    const organization = await this.organizationService.getOrganization(id);
    if (!organization)
      throw new NotFoundException(`Organization with ID ${id} not found`);
    return organization;
  }

  @Post(API.getOrganizationPlan.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin, USER_ROLES.user] })
  async getOrganizationPlan(
    @OrganizationId()
    id: number,
  ): Promise<ResponseBodyType<typeof API.getOrganizationPlan>> {
    return await this.organizationService.getOrganizationPlanInfo(id);
  }

  @Post(API.getOrganizationMembers.path)
  @Authorized({ requiredRoles: [USER_ROLES.user] })
  async getMembers(
    @OrganizationId()
    organizationId: number,
  ): Promise<
    ReturnType<typeof API.getOrganizationMembers.getTypedResponseBody>
  > {
    return this.organizationService.getMembers(organizationId);
  }

  @Post(API.updateOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async updateOrganization(
    @Body()
    updateOrganizationDto: ReturnType<
      typeof API.updateOrganization.getTypedRequestBody
    >,
    @OrganizationId() organizationId: number,
  ) {
    await this.organizationService.updateOrganization(
      organizationId,
      updateOrganizationDto,
    );
  }

  @Post(API.addMemberToOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async addMemberToOrganization(
    @User()
    { organizationId }: UserFromRequest,
    @Body()
    addMemberToOrganizationDto: ReturnType<
      typeof API.addMemberToOrganization.getTypedRequestBody
    >,
  ) {
    await this.organizationService.addMemberToOrganization(
      organizationId,
      addMemberToOrganizationDto,
    );
  }

  @Post(API.changeMemberRoleInOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async changeMemberRoleInOrganization(
    @Body()
    changeMemberRoleInOrganizationDto: ReturnType<
      typeof API.changeMemberRoleInOrganization.getTypedRequestBody
    >,
    @OrganizationId() organizationId: number,
  ) {
    await this.userService.changeMemberRoleInOrganization(
      organizationId,
      changeMemberRoleInOrganizationDto,
    );
  }

  @Post(API.deleteMemberFromOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async deleteMemberFromOrganization(
    @User()
    { organizationId }: UserFromRequest,
    @Body()
    deleteMemberFromOrganizationDto: ReturnType<
      typeof API.deleteMemberFromOrganization.getTypedRequestBody
    >,
  ) {
    await this.organizationService.deleteMemberFromOrganization(
      organizationId,
      deleteMemberFromOrganizationDto,
    );
  }

  @Post(API.deleteOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.owner] })
  async deleteOrganization(
    @User()
    { organizationId }: UserFromRequest,
  ) {
    await this.organizationService.deleteOrganization(organizationId);
  }

  @Post(API.leaveOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.user] })
  async leaveOrganization(
    @User()
    { userId, organizationId }: UserFromRequest,
  ) {
    await this.organizationService.deleteMemberFromOrganization(
      organizationId,
      { userId },
    );
  }

  @Post(API.getOrganizations.path)
  @Authorized({ requiredRoles: [USER_ROLES.superAdmin] })
  async getOrganizations(
    @Body() params: ReturnType<typeof API.getOrganizations.getTypedRequestBody>,
  ): Promise<ResponseBodyType<typeof API.getOrganizations>> {
    return await this.organizationService.getOrganizations(params);
  }

  @Post(API.createOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.superAdmin] })
  async createOrganization(
    @Body()
    createOrganizationDto: ReturnType<
      typeof API.createOrganization.getTypedRequestBody
    >,
  ) {
    await this.organizationService.createOrganization(createOrganizationDto);
  }

  @Post(API.getAdminStats.path)
  @Authorized({ requiredRoles: [USER_ROLES.superAdmin] })
  async getStats(): Promise<ResponseBodyType<typeof API.getAdminStats>> {
    return this.organizationService.getStats();
  }

  @Post(API.updateSuggestedTagContext.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async updateSuggestedTagContext(
    @Body() { suggested_tag_context }: UpdateSuggestedTagContextDto,
    @OrganizationId() organizationId: number,
  ): Promise<ResponseBodyType<typeof API.updateSuggestedTagContext>> {
    await this.organizationService.updateSuggestedTagContext(
      organizationId,
      suggested_tag_context
    );
    return this.organizationService.getOrganization(organizationId);
  }

  @Post(API.assignUserToTag.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async assignUserToTag(
    @Body() { userId, tagId, action }: ReturnType<typeof API.assignUserToTag.getTypedRequestBody>,
  ): Promise<ResponseBodyType<typeof API.assignUserToTag>> {
    const supabase = this.dbService.supabase;

    if (action === 'unassign') {
      // Remove the user-tag assignment
      await supabase
        .from('user_tags')
        .delete()
        .eq('user_id', userId)
        .eq('tag_id', tagId)
        .throwOnError();
    } else {
      // Check if the assignment already exists
      const { data: existingAssignment } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', userId)
        .eq('tag_id', tagId)
        .maybeSingle();

      if (!existingAssignment) {
        // If no assignment exists, create one
        await supabase
          .from('user_tags')
          .insert({ user_id: userId, tag_id: tagId })
          .throwOnError();
      }
    }

    return;
  }

  // @Post()
  // async createOrganization(
  //   @Body() createOrganizationDto: CreateOrganizationDto,
  // ) {
  //   return this.organizationService.createOrganization(createOrganizationDto);
  // }

  // @Get()
  // async getAllOrganizations() {
  //   return this.organizationService.getAllOrganizations();
  // }
}
