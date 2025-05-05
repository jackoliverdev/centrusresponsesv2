import { DBService } from '@/db/db.service';
import { FirecrawlService } from '@/firecrawl/firecrawl.service';
import { OpenAiService } from '@/open-ai/open-ai.service';
import { StorageService } from '@/storage/storage.service';
import { OrganizationService } from '@/organization/organization.service';
import { TablesInsert, TablesUpdate } from '@/utils/supabase.types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { getKnowledgeBaseType, TagItemData } from 'common';
import { NotFoundError } from 'openai';
import { TagService } from '@/tag/tag.service';
import { VectorStoreService } from '@/vector-store/vector-store.service';
import { DocumentFolderService } from './document-folder.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly dbService: DBService,
    private readonly storageService: StorageService,
    private readonly openAiService: OpenAiService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly firecrawlService: FirecrawlService,
    private readonly organizationService: OrganizationService,
    private readonly tagService: TagService,
    private readonly documentFolderService: DocumentFolderService,
  ) {}

  async getDocument(id: string) {
    const supabase = this.dbService.supabase;
    const { data: document } = await supabase
      .from('documents')
      .select(
        '*,documentTag:tags(id,name,backgroundColor:background_color,textColor:text_color,createdAt:created_at,organizationId:organization_id,userId:user_id,context)',
      )
      .eq('id', id)
      .single()
      .throwOnError();

    if (!document) return null;

    return { ...document, tag: document.documentTag?.name ?? null };
  }

  async getDocuments(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data: documents } = await supabase
      .from('documents')
      .select(
        '*,documentTag:tags(id,name,backgroundColor:background_color,textColor:text_color,createdAt:created_at,organizationId:organization_id,userId:user_id,context)',
      )
      .order('created_at')
      .eq('organization_id', organizationId)
      .throwOnError();

    return documents.map((document) => ({
      ...document,
      tag: document.documentTag?.name ?? null,
    }));
  }

  async update(
    id: string,
    data: TablesUpdate<'documents'>,
    tagData?: TagItemData,
  ) {
    const document = await this.getDocument(id);
    if (tagData) {
      const [filteredTag] = await this.tagService.processNewTags(
        document.organization_id,
        [tagData],
      );

      data.tag_id = filteredTag.id;

      const newTag = data.tag_id;
      const oldTag = document.tag_id;

      if (newTag !== oldTag)
        await this.vectorStoreService.transferFile(
          id,
          oldTag,
          newTag,
          document.organization_id,
        );
    }

    const supabase = this.dbService.supabase;
    await supabase.from('documents').update(data).eq('id', id).throwOnError();
  }

  async bulkUpdate(
    ids: string[],
    data: TablesUpdate<'documents'>,
    tagData?: TagItemData,
  ) {
    const supabase = this.dbService.supabase;

    const { data: documents } = await supabase
      .from('documents')
      .select('id,organization_id,tag_id')
      .in('id', ids)
      .throwOnError();

    if (tagData && documents.length > 0) {
      const [filteredTag] = await this.tagService.processNewTags(
        documents[0].organization_id,
        [tagData],
      );

      data.tag_id = filteredTag.id;
    }

    if (data.tag_id) {
      const newTag = data.tag_id;

      for (const doc of documents.filter((doc) => newTag !== doc.tag_id)) {
        await this.vectorStoreService.transferFile(
          doc.id,
          doc.tag_id,
          newTag,
          doc.organization_id,
        )
      }
    }

    await supabase.from('documents').update(data).in('id', ids).throwOnError();
  }

  async deleteDocument(id: string) {
    const { path, tag_id, organization_id } = await this.getDocument(id);
    if (tag_id)
      await this.vectorStoreService.deleteFile(tag_id, id, organization_id);
    try {
      await this.openAiService.deleteFile(id);
    } catch (e) {
      if (!(e instanceof NotFoundError)) throw e;
    }
    const supabase = this.dbService.supabase;
    // Delete document folder associations first
    await supabase.from('document_folders').delete().eq('document_id', id).throwOnError();
    // Then delete the document
    await supabase.from('documents').delete().eq('id', id).throwOnError();
    if (path) await supabase.storage.from('files').remove([path]);
  }

  async bulkDelete(ids: string[]) {
    const supabase = this.dbService.supabase;
    const { data: documents } = await supabase
      .from('documents')
      .select('id,tag_id,organization_id,path')
      .in('id', ids)
      .throwOnError();

    const promises: Promise<unknown>[] = [];

    documents.forEach(({ id, tag_id, path, organization_id }) => {
      if (tag_id) {
        promises.push(
          this.vectorStoreService.deleteFile(tag_id, id, organization_id),
        );
      }
      promises.push(
        this.openAiService.deleteFile(id).catch((e) => {
          if (!(e instanceof NotFoundError)) throw e;
        }),
      );
      if (path) {
        promises.push(supabase.storage.from('files').remove([path]));
      }
      // Add deletion of document folder associations as a Promise
      promises.push(
        new Promise((resolve) => {
          resolve(supabase.from('document_folders').delete().eq('document_id', id));
        })
      );
    });

    void Promise.all(promises);

    await supabase.from('documents').delete().in('id', ids).throwOnError();
  }

  async getDriveDocumentsWithTags(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data } = await supabase
      .from('documents')
      .select('id, tag:tags(id,name), drive_file_id')
      .eq('organization_id', organizationId)
      .neq('drive_file_id', null);

    return data.map(({ drive_file_id, tag }) => {
      return {
        id: drive_file_id,
        tag: tag.name,
        tagId: tag.id,
      };
    });
  }

  async deleteDriveDocuments(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data: documents } = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organizationId)
      .neq('drive_file_id', null);

    await Promise.all(documents.map(({ id }) => this.deleteDocument(id)));
  }

  async getTeamsDocumentsWithTags(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data } = await supabase
      .from('documents')
      .select('id, tag:tags(id,name), teams_document')
      .eq('organization_id', organizationId)
      .eq('teams_document', true);

    return data.map(({ id, tag }) => ({
      id,
      tag: tag.name,
      tagId: tag.id,
    }));
  }

  async deleteTeamsDocuments(organizationId: number) {
    const supabase = this.dbService.supabase;
    const { data: documents } = await supabase
      .from('documents')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('teams_document', true);

    await Promise.all(documents.map(({ id }) => this.deleteDocument(id)));
  }

  async upload(file: File, tag: string = '', organizationId: number) {
    // Remove any "- Sheet1" or similar suffixes from Excel files
    const cleanName = file.name.replace(/\s*-\s*Sheet\d+(\.[^.]+)?$/, '$1');
    const path = await this.storageService.uploadDocument(file);
    return await this.addDocument({
      name: cleanName,
      path,
      tag,
      organization_id: organizationId,
    });
  }

  async addDocument(
    data: ({ name: string; path: string } | { url: string }) &
      Omit<TablesInsert<'documents'>, 'id' | 'type' | 'size' | 'name' | 'path'>,
  ) {
    if ('url' in data) return await this.addWebsiteDocument(data);
    const type = getKnowledgeBaseType(data.name);
    if (type == 'text') return await this.addTextDocument(data);
    if (type == 'audio') return await this.addAudioDocument(data);
    throw new BadRequestException('Unsupported Document');
  }

  async addFile(file: File, data: Omit<TablesInsert<'documents'>, 'id'>) {
    const currentUsage = await this.usage(data.organization_id);
    const usageLimit =
      await this.organizationService.usageLimitsForOrganization(
        data.organization_id,
      );
    const newSize = data.size + currentUsage;
    if (newSize >= usageLimit.storage)
      throw new BadRequestException("You've reached your document limit");

    const openaiFile = await this.openAiService.createFile(file);
    if (data.tag_id) {
      await this.vectorStoreService.addFile(
        openaiFile.id,
        data.tag_id,
        data.organization_id,
      );
    }
    const { data: document } = await this.dbService.supabase
      .from('documents')
      .insert({ ...data, id: openaiFile.id })
      .select('id')
      .throwOnError();
    return document[0].id;
  }

  async addTextDocument(
    data: Omit<TablesInsert<'documents'>, 'type' | 'size' | 'id'>,
  ) {
    const { name, path } = data;
    const size = await this.storageService.getDocumentSize(data.path);
    const file = await this.storageService.downloadDocument(path, name);
    return await this.addFile(file, { ...data, type: 'text', size });
  }

  async addAudioDocument(
    data: Omit<TablesInsert<'documents'>, 'type' | 'size' | 'id'>,
  ) {
    const { name, path } = data;
    const downloadedDocument = await this.storageService.downloadDocument(
      path,
      name,
    );
    const response = await this.openAiService.createTranscript({
      file: downloadedDocument,
      model: 'whisper-1',
      response_format: 'text',
      stream: false
    });

    const transcript = response.text;
    const size = await this.storageService.getDocumentSize(path);
    const file = new File([transcript], `${name}.txt`, { type: 'text/plain' });
    return await this.addFile(file, { ...data, type: 'audio', size });
  }

  async addWebsiteDocument({
    url,
    ...data
  }: Omit<
    TablesInsert<'documents'>,
    'id' | 'type' | 'size' | 'name' | 'path'
  > & {
    url: string;
  }) {
    const markdown = await this.firecrawlService.scrapeMarkdown(url);

    const size = markdown.length;
    const file = new File([markdown], `${url.replaceAll(/[\W_]+/g, '-')}.md`, {
      type: 'text/plain',
    });
    const path = await this.storageService.uploadDocument(file);
    return await this.addFile(file, {
      ...data,
      name: url,
      type: 'website',
      size,
      path,
    });
  }

  async transcribeAudio(data: { name: string; path: string }) {
    const { name, path } = data;

    const downloadedDocument = await this.storageService.downloadDocument(
      path,
      name,
    );

    const response = await this.openAiService.createTranscript({
      file: downloadedDocument,
      model: 'whisper-1',
      response_format: 'text',
      stream: false
    });

    const transcript = response.text;
    const size = await this.storageService.getDocumentSize(path);

    return { transcript };
  }

  async usage(organizationId: number) {
    const { data } = await this.dbService.supabase
      .from('documents')
      .select('size.sum()')
      .eq('organization_id', organizationId)
      .limit(1)
      .single()
      .throwOnError();

    //@ts-expect-error For some unknown reason, supabase returns complains about the sum function
    return data.sum ?? 0;
  }

  /**
   * Scans a website to retrieve its sitemap/available pages
   */
  async scanWebsite(url: string) {
    return await this.firecrawlService.scanWebsite(url);
  }

  /**
   * Crawls multiple pages from a website and combines their content
   */
  async crawlWebsitePages({
    urls,
    name,
    organizationId,
  }: {
    urls: string[];
    name: string;
    organizationId: number;
  }) {
    // Check usage/limits
    const currentUsage = await this.usage(organizationId);
    const usageLimit = await this.organizationService.usageLimitsForOrganization(
      organizationId,
    );
    
    // Ensure we're not exceeding storage limits
    if (currentUsage >= usageLimit.storage) {
      throw new BadRequestException("You've reached your document limit");
    }

    // Crawl all the pages and combine the content
    const markdown = await this.firecrawlService.crawlMultiplePages(urls);
    
    // Create file from markdown content
    const size = markdown.length;
    const file = new File([markdown], `${name}.md`, { type: 'text/markdown' });
    const path = await this.storageService.uploadDocument(file);
    
    // Add file to database
    return {
      id: await this.addFile(file, {
        name,
        path,
        type: 'website',
        size,
        organization_id: organizationId,
      }),
    };
  }

  async getSuggestedTags(documentId: string, organizationId: number, userId?: number) {
    try {
      // Get document content
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Get organization's existing tags
      const { data: existingTags, error: tagsError } = await this.dbService.supabase
        .from('tags')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null);

      if (tagsError) {
        throw new Error('Failed to fetch tags');
      }

      // Get organization context and settings
      const { data: org, error: orgError } = await this.dbService.supabase
        .from('organizations')
        .select('ai_context, suggested_tag_context')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        throw new Error('Failed to fetch organization details');
      }

      // Get user context if userId provided
      let userContext = '';
      if (userId) {
        const { data: user, error: userError } = await this.dbService.supabase
          .from('users')
          .select('ai_user_context, first_name, last_name, profile')
          .eq('id', userId)
          .single();
        
        if (userError) {
          throw new Error('Failed to fetch user details');
        } else if (user) {
          if (user.first_name) userContext += `USER FIRST NAME: ${user.first_name}\n`;
          if (user.last_name) userContext += `USER LAST NAME: ${user.last_name}\n`;
          
          try {
            if (user.profile) {
              const profileData = JSON.parse(user.profile);
              if (profileData?.position) {
                userContext += `USER POSITION: ${profileData.position}\n`;
              }
            }
          } catch (error) {
            // Silently handle profile parsing error
          }
          
          if (user.ai_user_context) {
            userContext += `USER CONTEXT: ${user.ai_user_context}\n`;
          }
        }
      }

      // Read document content and truncate it
      const file = await this.storageService.downloadDocument(document.path, document.name);
      const fullContent = await file.text();
      
      // Get first 1000 chars and last 1000 chars to capture important content
      const maxCharsPerSection = 1000;
      const start = fullContent.slice(0, maxCharsPerSection);
      const end = fullContent.slice(-maxCharsPerSection);
      
      // Extract some content from middle if document is large enough
      let middle = '';
      if (fullContent.length > maxCharsPerSection * 2) {
        const middleStart = Math.floor(fullContent.length / 2) - (maxCharsPerSection / 2);
        middle = fullContent.slice(middleStart, middleStart + maxCharsPerSection);
      }

      const truncatedContent = `${start}\n\n[...]\n\n${middle}\n\n[...]\n\n${end}`;

      // Get all documents for the org, with their tag (only those with a tag assigned)
      const { data: docsWithTags, error: docsError } = await this.dbService.supabase
        .from('documents')
        .select('name, tag_id, tags(name)')
        .eq('organization_id', organizationId)
        .not('tag_id', 'is', null);

      if (docsError) {
        throw new Error('Failed to fetch documents with tags');
      }

      // Build a mapping: tag name -> [file names]
      const tagToFiles: Record<string, string[]> = {};
      for (const doc of docsWithTags || []) {
        if (doc.tag_id && doc.tags?.name) {
          if (!tagToFiles[doc.tags.name]) tagToFiles[doc.tags.name] = [];
          tagToFiles[doc.tags.name].push(doc.name);
        }
      }

      // Build the examples string
      const tagExamples = Object.entries(tagToFiles)
        .map(([tag, files]) => `${tag}: ${files.map(f => `"${f}"`).join(', ')}`)
        .join('\n');

      // Build prompt for GPT to analyze document and suggest tags
      const prompt = `You are a tag suggestion system. Your primary task is to follow the SUGGESTED TAG CONTEXT rules and analyse the document to suggest the most appropriate tag.

SUGGESTED TAG CONTEXT (FOLLOW THESE RULES STRICTLY):
${org?.suggested_tag_context || 'No specific tag context provided'}

Here are the AVAILABLE TAGS (ONLY USE THESE - DO NOT CREATE NEW ONES):
${existingTags?.map(tag => `${tag.id}. ${tag.name} (bg: ${tag.background_color}, text: ${tag.text_color})`).join('\n') || 'No existing tags'}

EXAMPLES OF FILES ALREADY ASSIGNED TO EACH TAG:
${tagExamples}

Rules:
1. Explicitly follow SUGGESTED TAG CONTEXT if provided - this is your primary guidance.
2. Only suggest existing tags, do not create new ones.
3. Only include 1 tag where confidence > 0.9.
4. Use exact tag IDs, names, and colours from the list above.
5. Return ONLY the JSON object, no other text or formatting.

Required JSON format:
{
  "suggestions": [
    {
      "id": <tag_id>,
      "name": "<tag_name>",
      "backgroundColor": "<background_color>",
      "textColor": "<text_color>",
      "confidence": <number_between_0_and_1>
    }
  ]
}

This is the details for the file you need to suggest a tag for:

FILE NAME: ${document.name}
FILE TYPE: ${document.type}
FILE PATH: ${document.path}

DOCUMENT CONTENT (truncated):
${truncatedContent}

Here is some additional information about the current user and their organisation:

USER CONTEXT:
${userContext}

ORGANISATION CONTEXT:
${org?.ai_context || ''}`;

      try {
        // Use GPT-4.1-nano for quick, focused response
        const response = await this.openAiService.prompt(prompt, {
          model: 'gpt-4.1-nano'
        });

        // Clean the response to ensure it's valid JSON
        const cleanedResponse = response.trim().replace(/^```json\s*|\s*```$/g, '');
        
        try {
          const suggestions = JSON.parse(cleanedResponse);
          return suggestions.suggestions || [];
        } catch (error) {
          return [];
        }
      } catch (error) {
        return [];
      }
    } catch (error) {
      return [];
    }
  }
}
