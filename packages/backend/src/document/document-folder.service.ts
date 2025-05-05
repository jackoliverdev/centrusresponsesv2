import { DBService } from '@/db/db.service';
import { Injectable } from '@nestjs/common';
import { CreateFolderDto, UpdateFolderDto } from 'common';

@Injectable()
export class DocumentFolderService {
  constructor(private readonly dbService: DBService) {}

  async getFolders(organizationId: number, userId: number) {
    const { data } = await this.dbService.supabase
      .from('folders')
      .select(
        'id,userId:user_id,name,color,global,module,documentFolders:document_folders(document:documents(id,name,type,path,size,tag_id,documentTag:tags(id,name,backgroundColor:background_color,textColor:text_color)))',
      )
      .eq('organization_id', organizationId)
      .eq('module', 'documents')
      .or(`user_id.eq.${userId},global.is.true`)
      .order('created_at', { ascending: true });

    return (data || []).map(({ documentFolders, ...folder }) => ({
      ...folder,
      documents: documentFolders
        .filter((folder) => folder.document)
        .map((docFolder) => docFolder.document),
    }));
  }

  async createFolder(dto: CreateFolderDto & { userId: number; organizationId: number }) {
    const { data: folder } = await this.dbService.supabase
      .from('folders')
      .insert({
        name: dto.name,
        color: dto.color,
        global: dto.global || false,
        module: 'documents',
        user_id: dto.userId,
        organization_id: dto.organizationId,
      })
      .select('id, userId:user_id, name, color, module, global')
      .single()
      .throwOnError();

    return folder;
  }

  async updateFolder(dto: UpdateFolderDto & { userId?: number; organizationId: number }) {
    const { data: folder } = await this.dbService.supabase
      .from('folders')
      .update({
        name: dto.name,
        color: dto.color,
        global: dto.global,
      })
      .eq('id', dto.id)
      .eq('organization_id', dto.organizationId)
      .select('id, userId:user_id, name, color, module, global')
      .single()
      .throwOnError();

    return folder;
  }

  async deleteFolder(dto: { id: number; userId?: number; organizationId: number }) {
    const { data: folder } = await this.dbService.supabase
      .from('folders')
      .delete()
      .eq('id', dto.id)
      .eq('organization_id', dto.organizationId)
      .select('id, module, color, name, global, organizationId:organization_id, userId:user_id')
      .maybeSingle()
      .throwOnError();

    return folder;
  }

  async attachDocumentToFolder(dto: {
    documentId: string;
    folderId: number;
    userId: number;
    organizationId: number;
  }) {
    // Check if document is already in folder
    const { data: existingDocFolder } = await this.dbService.supabase
      .from('document_folders')
      .select('id')
      .eq('document_id', dto.documentId)
      .eq('folder_id', dto.folderId)
      .eq('user_id', dto.userId)
      .maybeSingle();
    
    // If document is already in folder, fetch and return the full object
    if (existingDocFolder) {
      const { data: fullDocFolder } = await this.dbService.supabase
        .from('document_folders')
        .select('id, organizationId:organization_id, userId:user_id, documentId:document_id, folderId:folder_id')
        .eq('id', existingDocFolder.id)
        .single()
        .throwOnError();
      
      return fullDocFolder;
    }

    const { data: documentFolder } = await this.dbService.supabase
      .from('document_folders')
      .insert({
        document_id: dto.documentId,
        organization_id: dto.organizationId,
        user_id: dto.userId,
        folder_id: dto.folderId,
      })
      .select('id, organizationId:organization_id, userId:user_id, documentId:document_id, folderId:folder_id')
      .maybeSingle()
      .throwOnError();

    return documentFolder;
  }

  async detachDocumentFromFolder(dto: {
    folderId: number;
    documentId: string;
    userId: number;
  }) {
    const { data: documentFolder } = await this.dbService.supabase
      .from('document_folders')
      .delete()
      .eq('folder_id', dto.folderId)
      .eq('user_id', dto.userId)
      .eq('document_id', dto.documentId)
      .select('*')
      .single()
      .throwOnError();

    return documentFolder;
  }

  async bulkAttachDocumentsToFolder(dto: {
    documentIds: string[];
    folderId: number;
    userId: number;
    organizationId: number;
  }) {
    // Create an array of objects for bulk insertion
    const insertData = dto.documentIds.map(documentId => ({
      document_id: documentId,
      folder_id: dto.folderId,
      user_id: dto.userId,
      organization_id: dto.organizationId
    }));
    
    // Ignore conflicts to handle documents already in folder
    const { data: attachments } = await this.dbService.supabase
      .from('document_folders')
      .upsert(insertData, { onConflict: 'document_id,folder_id', ignoreDuplicates: true })
      .select('id, documentId:document_id, folderId:folder_id')
      .throwOnError();
      
    return attachments || [];
  }
}