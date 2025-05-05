import { Body, Controller, Post } from '@nestjs/common';
import { DocumentService } from './document.service';
import { API, RequestBodyType, ResponseBodyType } from 'common';
import { Authorized } from '@/auth-guard/auth-guard';
import { OrganizationId, User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { DocumentFolderService } from './document-folder.service';

@Controller()
@Authorized({ requiredRoles: ['admin'] })
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly documentFolderService: DocumentFolderService,
  ) {}

  @Post(API.getDocuments.path)
  async getDocuments(
    @OrganizationId() organizationId: number,
  ): Promise<ResponseBodyType<typeof API.getDocuments>> {
    return await this.documentService.getDocuments(organizationId);
  }

  @Post(API.addDocument.path)
  async addDocument(
    @Body() body: RequestBodyType<typeof API.addDocument>,
    @OrganizationId() organizationId: number,
  ): Promise<ResponseBodyType<typeof API.addDocument>> {
    await this.documentService.addDocument({
      ...body,
      organization_id: organizationId,
    });
    return;
  }

  @Post(API.updateDocument.path)
  async update(
    @Body()
    { id, data, tagData }: RequestBodyType<typeof API.updateDocument>,
  ): Promise<ResponseBodyType<typeof API.updateDocument>> {
    await this.documentService.update(id, data, tagData);
    return;
  }

  @Post(API.bulkUpdateDocument.path)
  async bulkUpdate(
    @Body()
    { ids, data, tagData }: RequestBodyType<typeof API.bulkUpdateDocument>,
  ): Promise<ResponseBodyType<typeof API.bulkUpdateDocument>> {
    await this.documentService.bulkUpdate(ids, data, tagData);
    return;
  }

  @Post(API.deleteDocument.path)
  async deleteDocument(
    @Body() { id }: RequestBodyType<typeof API.deleteDocument>,
  ): Promise<ResponseBodyType<typeof API.deleteDocument>> {
    await this.documentService.deleteDocument(id);
    return;
  }

  @Post(API.bulkDeleteDocument.path)
  async bulkDelete(
    @Body()
    { ids }: RequestBodyType<typeof API.bulkDeleteDocument>,
  ): Promise<ResponseBodyType<typeof API.bulkDeleteDocument>> {
    await this.documentService.bulkDelete(ids);
    return;
  }

  @Post(API.transcribeAudio.path)
  async transcribeAudio(
    @Body() body: RequestBodyType<typeof API.transcribeAudio>,
  ): Promise<ResponseBodyType<typeof API.transcribeAudio>> {
    return await this.documentService.transcribeAudio(body);
  }

  @Post(API.scanWebsite.path)
  async scanWebsite(
    @Body() body: RequestBodyType<typeof API.scanWebsite>,
    @OrganizationId() organizationId: string,
  ): Promise<ResponseBodyType<typeof API.scanWebsite>> {
    return await this.documentService.scanWebsite(body.url);
  }

  @Post(API.crawlWebsitePages.path)
  async crawlWebsitePages(
    @Body() body: RequestBodyType<typeof API.crawlWebsitePages>,
    @OrganizationId() organizationId: string,
  ): Promise<ResponseBodyType<typeof API.crawlWebsitePages>> {
    return await this.documentService.crawlWebsitePages({
      urls: body.urls,
      name: body.name,
      organizationId: Number(organizationId),
    });
  }

  @Post(API.getSuggestedTags.path)
  @Authorized()
  async getSuggestedTags(
    @Body() { documentId }: ReturnType<typeof API.getSuggestedTags.getTypedRequestBody>,
    @User() { organizationId, userId }: UserFromRequest,
  ): Promise<ReturnType<typeof API.getSuggestedTags.getTypedResponseBody>> {
    return await this.documentService.getSuggestedTags(documentId, organizationId, userId);
  }

  @Post(API.getDocumentFolders.path)
  @Authorized()
  async getDocumentFolders(@User() { organizationId, userId }: UserFromRequest) {
    return await this.documentFolderService.getFolders(organizationId, userId);
  }

  @Post(API.createDocumentFolder.path)
  @Authorized()
  async createDocumentFolder(
    @Body() params: ReturnType<typeof API.createDocumentFolder.getTypedRequestBody>,
    @User() { organizationId, userId }: UserFromRequest,
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
    @Body() params: ReturnType<typeof API.updateDocumentFolder.getTypedRequestBody>,
    @User() { organizationId, userId }: UserFromRequest,
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
    @Body() params: ReturnType<typeof API.deleteDocumentFolder.getTypedRequestBody>,
    @User() { organizationId, userId }: UserFromRequest,
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
    @Body() params: ReturnType<typeof API.attachDocumentToFolder.getTypedRequestBody>,
    @User() { organizationId, userId }: UserFromRequest,
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
    @Body() params: ReturnType<typeof API.detachDocumentFromFolder.getTypedRequestBody>,
    @User() { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.detachDocumentFromFolder({
      ...params,
      userId,
    });
  }

  @Post(API.bulkAttachDocumentToFolder.path)
  @Authorized()
  async bulkAttachDocumentToFolder(
    @Body() params: ReturnType<typeof API.bulkAttachDocumentToFolder.getTypedRequestBody>,
    @User() { organizationId, userId }: UserFromRequest,
  ) {
    return await this.documentFolderService.bulkAttachDocumentsToFolder({
      ...params,
      organizationId,
      userId,
    });
  }
}
