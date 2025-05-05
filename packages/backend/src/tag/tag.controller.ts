import { Body, Controller, Post } from '@nestjs/common';
import { TagService } from './tag.service';
import { API, RequestBodyType, ResponseBodyType, USER_ROLES } from 'common';
import { OrganizationId, User } from '@/auth-guard/user.decorator';
import { Authorized } from '@/auth-guard/auth-guard';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';

@Controller()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post(API.createTag.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async create(
    @User() user: UserFromRequest,
    @Body() params: RequestBodyType<typeof API.createTag>,
  ): Promise<ResponseBodyType<typeof API.createTag>> {
    return await this.tagService.create(
      {
        ...params,
        context: params.context || null,
      },
      user.organizationId,
      user.userId,
    );
  }

  @Post(API.updateTag.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async update(
    @Body() params: RequestBodyType<typeof API.updateTag>,
  ): Promise<ResponseBodyType<typeof API.updateTag>> {
    return await this.tagService.update({
      ...params,
      context: params.context || null,
    });
  }

  @Post(API.deleteTag.path)
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async delete(
    @Body() { id }: RequestBodyType<typeof API.deleteTag>,
  ): Promise<ResponseBodyType<typeof API.deleteTag>> {
    return await this.tagService.delete(id);
  }

  @Post(API.getTags.path)
  @Authorized()
  async getAll(
    @OrganizationId() organizationId: number,
  ): Promise<ResponseBodyType<typeof API.getTags>> {
    return await this.tagService.getAll(organizationId);
  }

  @Post(API.getTagsWithInfo.path)
  @Authorized()
  async getAllWithInfo(
    @OrganizationId() organizationId: number,
    @Body() params: ReturnType<typeof API.getTagsWithInfo.getTypedRequestBody>,
  ): Promise<ResponseBodyType<typeof API.getTagsWithInfo>> {
    return await this.tagService.getAllWithInfo(organizationId, params);
  }
}
