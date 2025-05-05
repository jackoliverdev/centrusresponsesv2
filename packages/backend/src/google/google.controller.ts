import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { API, RequestBodyType, ResponseBodyType } from 'common';
import { GoogleService } from './google.service';
import { OrganizationService } from '@/organization/organization.service';
import { Authorized } from '@/auth-guard/auth-guard';
import { OrganizationId } from '@/auth-guard/user.decorator';

@Controller()
export class GoogleController {
  constructor(
    private googleService: GoogleService,
    private organizationService: OrganizationService,
  ) {}

  @Authorized({ requiredRoles: ['admin'] })
  @Post(API.googleAuth.path)
  async auth() {
    const url = await this.googleService.getAuthUrl();
    return { url };
  }

  @Authorized({ requiredRoles: ['admin'] })
  @Get('google/callback')
  async callback(
    @Query('code') code: string,
    @OrganizationId() organizationId: number,
  ) {
    const token = await this.googleService.getTokenFromCode(code);
    await this.organizationService.updateOrganization(organizationId, {
      google_token: token,
    });
    return true;
  }

  @Authorized({ requiredRoles: ['admin'] })
  @Post(API.driveFolders.path)
  async folders(
    @OrganizationId() organizationId: number,
  ): Promise<ResponseBodyType<typeof API.driveFolders>> {
    return await this.googleService.getFolders(organizationId);
  }

  @Authorized({ requiredRoles: ['admin'] })
  @Post(API.driveSync.path)
  async sync(
    @Body() { folderId }: RequestBodyType<typeof API.driveSync>,
    @OrganizationId() organizationId: number,
  ): Promise<ResponseBodyType<typeof API.driveSync>> {
    await this.googleService.sync(folderId, organizationId);
    return;
  }
}
