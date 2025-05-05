import { Body, Controller, Post } from '@nestjs/common';
import { UploadedFile } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Authorized } from '@/auth-guard/auth-guard';
import { API } from 'common';
import { ThreadService } from '@/thread/thread.service';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { User } from '@/auth-guard/user.decorator';

@Controller()
export class ThreadController {
  constructor(private readonly threadService: ThreadService) {}

  @Post(API.getPinnedThreads.path)
  @Authorized()
  async getPinnedThreads(
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.getPinnedThreads.getTypedResponseBody>> {
    return await this.threadService.getPinnedThreads(organizationId, userId);
  }

  @Post(API.pinThread.path)
  @Authorized()
  async pinThread(
    @Body()
    { threadId }: ReturnType<typeof API.pinThread.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.pinThread.getTypedResponseBody>> {
    return await this.threadService.pinThread(threadId, organizationId, userId);
  }

  @Post(API.unpinThread.path)
  @Authorized()
  async unpinThread(
    @Body()
    { threadId }: ReturnType<typeof API.unpinThread.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.unpinThread.getTypedResponseBody>> {
    return await this.threadService.unpinThread(
      threadId,
      organizationId,
      userId,
    );
  }

  @Post(API.reorderPinedThread.path)
  @Authorized()
  async reorderPinedThread(
    @Body()
    params: ReturnType<typeof API.reorderPinedThread.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.reorderPinedThread.getTypedResponseBody>> {
    return await this.threadService.reorderPinedThread(
      params,
      organizationId,
      userId,
    );
  }

  @Post(API.getThreadFolders.path)
  @Authorized()
  async getThreadFolders(
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.getThreadFolders.getTypedResponseBody>> {
    return await this.threadService.getFolders(organizationId, userId);
  }

  @Post(API.createThreadFolder.path)
  @Authorized()
  async createThreadFolder(
    @Body()
    params: ReturnType<typeof API.createThreadFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.createThreadFolder.getTypedResponseBody>> {
    return await this.threadService.createThreadFolder({
      ...params,
      organizationId,
      userId,
    });
  }

  @Post(API.updateThreadFolder.path)
  @Authorized()
  async updateThreadFolder(
    @Body()
    params: ReturnType<typeof API.updateThreadFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.updateThreadFolder.getTypedResponseBody>> {
    return await this.threadService.updateThreadFolder({
      ...params,
      organizationId,
      userId,
    });
  }

  @Post(API.deleteThreadFolder.path)
  @Authorized()
  async deleteThreadFolder(
    @Body()
    params: ReturnType<typeof API.deleteThreadFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.deleteThreadFolder.getTypedResponseBody>> {
    return await this.threadService.deleteThreadFolder({
      ...params,
      organizationId,
      userId,
    });
  }

  @Post(API.attachThreadToFolder.path)
  @Authorized()
  async attachThreadToFolder(
    @Body()
    params: ReturnType<typeof API.attachThreadToFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.attachThreadToFolder.getTypedResponseBody>> {
    return await this.threadService.attachThreadToFolder({
      ...params,
      organizationId,
      userId,
    });
  }

  @Post(API.detachThreadFromFolder.path)
  @Authorized()
  async detachThreadFromFolder(
    @Body()
    params: ReturnType<typeof API.detachThreadFromFolder.getTypedRequestBody>,
    @User()
    { userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.detachThreadFromFolder.getTypedResponseBody>> {
    return await this.threadService.detachThreadFromFolder({
      ...params,
      userId,
    });
  }

  // Upload a thread-specific attachment
  @Post(API.uploadThreadAttachment.path)
  @Authorized()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @UploadedFile() file: any,
    @Body() body: ReturnType<typeof API.uploadThreadAttachment.getTypedRequestBody>,
  ): Promise<ReturnType<typeof API.uploadThreadAttachment.getTypedResponseBody>> {
    const { threadId } = body;
    return await this.threadService.saveAttachment(file, threadId);
  }

  // Detach (delete) a thread-specific attachment
  @Post(API.detachThreadAttachment.path)
  @Authorized()
  async detachThreadAttachment(
    @Body() { id }: ReturnType<typeof API.detachThreadAttachment.getTypedRequestBody>,
  ): Promise<ReturnType<typeof API.detachThreadAttachment.getTypedResponseBody>> {
    await this.threadService.deleteAttachment(id);
    return;
  }

  @Post(API.getSuggestedPrompts.path)
  @Authorized()
  async getSuggestedPrompts(
    @Body() { tagId }: ReturnType<typeof API.getSuggestedPrompts.getTypedRequestBody>,
    @User() { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.getSuggestedPrompts.getTypedResponseBody>> {
    return await this.threadService.generateSuggestedPrompts(tagId, organizationId, userId);
  }
}
