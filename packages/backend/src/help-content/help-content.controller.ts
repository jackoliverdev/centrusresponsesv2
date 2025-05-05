import { Body, Controller, Post } from '@nestjs/common';
import { HelpContentService } from './help-content.service';
import { API, RequestBodyType, ResponseBodyType } from 'common';
import { User } from '@/auth-guard/user.decorator';
import { Authorized } from '@/auth-guard/auth-guard';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';

@Controller()
export class HelpContentController {
  constructor(private readonly helpContentService: HelpContentService) {}

  @Post(API.getHelpContents.path)
  @Authorized()
  async getAllContent(
    @User() user: UserFromRequest,
    @Body() { type }: RequestBodyType<typeof API.getHelpContents>,
  ): Promise<ResponseBodyType<typeof API.getHelpContents>> {
    return await this.helpContentService.getAllForType(
      type,
      user.roleInOrganization,
    );
  }

  @Post(API.getHelpContent.path)
  @Authorized()
  async getContent(
    @User() user: UserFromRequest,
    @Body() { id, type }: RequestBodyType<typeof API.getHelpContent>,
  ): Promise<ResponseBodyType<typeof API.getHelpContent>> {
    return await this.helpContentService.getForType(
      type,
      user.roleInOrganization,
      id,
    );
  }
}
