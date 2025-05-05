import { DBService } from '@/db/db.service';
import { OpenAiService } from '@/open-ai/open-ai.service';
import { TablesInsert } from '@/utils/supabase.types';
import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'openai';
import { TagService } from '@/tag/tag.service';

@Injectable()
export class VectorStoreService {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly dbService: DBService,
    private readonly tagService: TagService,
  ) {}

  async get(tagId: number, organizationId: number) {
    if (!tagId) throw new Error('Tag is required');
    const vectorStore = await this.findInDatabase(tagId, organizationId);
    if (vectorStore) return await this.openAiService.getVectorStore(vectorStore.id);
    return await this.create(tagId, organizationId);
  }

  async create(tagId: number, organizationId: number) {
    const tag = await this.tagService.getTagById(tagId);
    const newVectorStore = await this.openAiService.createVectorStore(tag.name);
    await this.createInDatabase({
      id: newVectorStore.id,
      tag_id: tagId,
      organization_id: organizationId,
    });
    return newVectorStore;
  }

  async list() {
    const { data } = await this.dbService.supabase
      .from('vector_stores')
      .select('*')
      .throwOnError();
    return data;
  }

  async uploadFile(file: File, tagId: number, organizationId: number) {
    const vectorStore = await this.get(tagId, organizationId);
    await this.openAiService.uploadVectorStoreFile(vectorStore.id, file);
  }

  async addFile(fileId: string, tagId: number, organizationId: number) {
    const vectorStore = await this.get(tagId, organizationId);
    await this.openAiService.createVectorStoreFile(vectorStore.id, fileId);
  }

  async transferFile(
    fileId: string,
    oldTag: number,
    newTag: number,
    organizationId: number,
  ) {
    if (!oldTag) return await this.addFile(fileId, newTag, organizationId);

    const oldVectorStore = await this.get(oldTag, organizationId);
    const newVectorStore = await this.get(newTag, organizationId);

    await this.openAiService.switchVectorStoreFile(
      fileId,
      oldVectorStore.id,
      newVectorStore.id,
    );
  }

  async deleteFile(tagId: number, fileId: string, organizationId: number) {
    if (!tagId) return;
    const vectorStore = await this.get(tagId, organizationId);
    try {
      await this.openAiService.deleteVectorStoreFile(vectorStore.id, fileId);
    } catch (e) {
      if (e instanceof NotFoundError) return;
      throw e;
    }
  }

  async findInDatabase(tagId: number, organizationId: number) {
    const { data } = await this.dbService.supabase
      .from('vector_stores')
      .select('id,organization_id,tag_id')
      .eq('tag_id', tagId)
      .eq('organization_id', organizationId)
      .limit(1)
      .maybeSingle()
      .throwOnError();
    return data;
  }

  async createInDatabase(data: TablesInsert<'vector_stores'>) {
    const { data: vectorStore } = await this.dbService.supabase
      .from('vector_stores')
      .insert(data)
      .select('*')
      .throwOnError();
    return vectorStore;
  }

  /**
   * Get document content by fetching its chunks from the database
   * @param documentId The document ID to fetch content for
   * @returns Array of document content chunks
   */
  async getDocumentContent(documentId: string): Promise<string[]> {
    try {
      // Get the document to find its tag
      const { data: document } = await this.dbService.supabase
        .from('documents')
        .select('tag_id, organization_id')
        .eq('id', documentId)
        .single();

      if (!document || !document.tag_id) {
        return ['Document content unavailable'];
      }

      // Find the vector store for this tag
      const vectorStore = await this.findInDatabase(document.tag_id, document.organization_id);
      if (!vectorStore) {
        return ['Document content unavailable - no vector store found'];
      }

      // Get chunks from database that match this document ID
      const { data: chunks } = await this.dbService.supabase
        .from('chunks')
        .select('content, metadata')
        .filter('metadata->file_id', 'eq', documentId);

      if (!chunks || chunks.length === 0) {
        return ['Document content unavailable - no chunks found'];
      }

      // Return an array of content strings
      return chunks.map(chunk => chunk.content || '').filter(content => content.trim() !== '');
    } catch (error) {
      console.error(`Error getting document content for ${documentId}:`, error);
      return ['Error retrieving document content'];
    }
  }
}
