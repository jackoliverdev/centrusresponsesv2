import { User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { Body, Controller, Post } from '@nestjs/common';
import { API } from 'common';
import { DocumentFolderService } from './document-folder.service';
import { Authorized } from '@/auth-guard/auth-guard';

@Controller()
export class DocumentFolderController {
  constructor(private readonly documentFolderService: DocumentFolderService) {}

  @Post(API.getDocumentFolders.path)
  @Authorized()
  async getDocumentFolders(
    @User() { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.getFolders(organizationId, userId);
  }

  @Post(API.createDocumentFolder.path)
  @Authorized()
  async createDocumentFolder(
    @Body()
    params: ReturnType<typeof API.createDocumentFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.createFolder({
      ...params,
      module: 'documents',
      organizationId,
      userId,
    });
  }

  @Post(API.updateDocumentFolder.path)
  @Authorized()
  async updateDocumentFolder(
    @Body()
    params: ReturnType<typeof API.updateDocumentFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.updateFolder({
      ...params,
      organizationId,
      userId,
    });
  }

  @Post(API.deleteDocumentFolder.path)
  @Authorized()
  async deleteDocumentFolder(
    @Body()
    params: ReturnType<typeof API.deleteDocumentFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.deleteFolder({
      ...params,
      organizationId,
      userId,
    });
  }

  @Post(API.attachDocumentToFolder.path)
  @Authorized()
  async attachDocumentToFolder(
    @Body()
    params: ReturnType<typeof API.attachDocumentToFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.attachDocumentToFolder({
      ...params,
      organizationId,
      userId,
    });
  }

  @Post(API.detachDocumentFromFolder.path)
  @Authorized()
  async detachDocumentFromFolder(
    @Body()
    params: ReturnType<typeof API.detachDocumentFromFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.detachDocumentFromFolder({
      ...params,
      userId,
    });
  }

  @Post(API.bulkAttachDocumentToFolder.path)
  @Authorized()
  async bulkAttachDocumentToFolder(
    @Body()
    params: ReturnType<typeof API.bulkAttachDocumentToFolder.getTypedRequestBody>,
    @User()
    { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.bulkAttachDocumentsToFolder({
      ...params,
      organizationId,
      userId,
    });
  }
}