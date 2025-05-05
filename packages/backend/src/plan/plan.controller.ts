import { Body, Controller, Post } from '@nestjs/common';
import { PlanService } from './plan.service';
import { API, ResponseBodyType, USER_ROLES } from 'common';
import { OrganizationId } from '@/auth-guard/user.decorator';
import { Authorized } from '@/auth-guard/auth-guard';

@Controller()
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post(API.getPlans.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async getAll(): Promise<ResponseBodyType<typeof API.getPlans>> {
    return this.planService.getAll();
  }

  @Post(API.getPlanAddons.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async getAddons(): Promise<ResponseBodyType<typeof API.getPlanAddons>> {
    return this.planService.getAddons();
  }

  @Post(API.getPlanAddon.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async getAddon(
    @Body()
    { id }: ReturnType<typeof API.getPlanAddon.getTypedRequestBody>,
  ): Promise<ResponseBodyType<typeof API.getPlanAddon>> {
    return this.planService.getAddon(id);
  }

  @Post(API.getPlanAddonForOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async getAddonForOrganization(
    @OrganizationId()
    organizationId: number,
  ): Promise<ResponseBodyType<typeof API.getPlanAddonForOrganization>> {
    return this.planService.getAddonForOrganization(organizationId);
  }

  @Post(API.updateLimitsForOrganization.path)
  @Authorized({ requiredRoles: [USER_ROLES.superAdmin] })
  async updateCustomLimitsForOrganization(
    @Body()
    {
      values,
      organizationId,
    }: ReturnType<typeof API.updateLimitsForOrganization.getTypedRequestBody>,
  ): Promise<ResponseBodyType<typeof API.updateLimitsForOrganization>> {
    await this.planService.updateCustomLimitsForOrganization(values, {
      organizationId,
    });

    return;
  }
}
