import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MicrosoftService } from './microsoft.service';
import { OrganizationService } from '@/organization/organization.service';
import { API, ResponseBodyType, USER_ROLES } from 'common';
import { OrganizationId } from '@/auth-guard/user.decorator';
import { Authorized } from '@/auth-guard/auth-guard';

@Authorized({ requiredRoles: [USER_ROLES.admin] })
@Controller()
export class MicrosoftController {
  constructor(
    private readonly microsoftService: MicrosoftService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post(API.microsoftAuth.path)
  async auth(): Promise<ResponseBodyType<typeof API.microsoftAuth>> {
    const url = await this.microsoftService.getAuthUrl();
    return { url };
  }

  @Post(API.getTeamsChannels.path)
  async channels(
    @OrganizationId() organizationId: number,
  ): Promise<ResponseBodyType<typeof API.getTeamsChannels>> {
    return await this.microsoftService.getAllChannels(organizationId);
  }

  @Post(API.teamsSync.path)
  async sync(
    @Body() data: ResponseBodyType<typeof API.teamsSync>,
    @OrganizationId() organizationId: number,
  ) {
    await this.microsoftService.sync(data, organizationId);
  }

  @Get('microsoft/callback')
  async redirect(
    @Query('code') code: string,
    @OrganizationId() organizationId: number,
  ) {
    const token = await this.microsoftService.getToken(code);
    await this.organizationService.updateOrganization(organizationId, {
      microsoft_token: token,
    });
  }
}
