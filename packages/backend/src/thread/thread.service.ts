import { DocumentService } from '@/document/document.service';
import { OpenAiService } from '@/open-ai/open-ai.service';
import { isFulfilled } from '@/utils/promise';
import { Injectable } from '@nestjs/common';

import {
  ResponseOutputMessage,
  ResponseOutputText,
  ResponseStreamEvent,
  ResponseInputMessageItem,
  ResponseInputText,
  ResponseReasoningItem,
  ResponseContent,
} from 'openai/resources/responses/responses';
import { Stream } from 'openai/streaming';
import { DBService } from '@/db/db.service';
import {
  AttachThreadFolderDto,
  CreateFolderDto,
  FolderWithThreadsSchema,
  PinnedThreadSchema,
  ReorderThreadDto,
  UpdateFolderDto,
} from 'common';
import { VectorStoreService } from '@/vector-store/vector-store.service';
import { UserService } from '@/user/user.service';
import { TagService } from '@/tag/tag.service';

@Injectable()
export class ThreadService {
  constructor(
    private dbService: DBService,
    private readonly openAiService: OpenAiService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly documentService: DocumentService,
    private readonly userService: UserService,
    private readonly tagService: TagService,
  ) {}

  async getPinnedThreads(
    organizationId: number,
    userId: number,
  ): Promise<PinnedThreadSchema[]> {
    const supabase = this.dbService.supabase;

    const { data } = await supabase
      .from('thread_pins')
      .select('id, order, threadId:thread_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('order', { ascending: true });

    return data ?? [];
  }

  async pinThread(threadId: string, organizationId: number, userId: number) {
    const supabase = this.dbService.supabase;

    const { data: lastPin } = await supabase
      .from('thread_pins')
      .select('order')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: pin } = await supabase
      .from('thread_pins')
      .insert({
        organization_id: organizationId,
        thread_id: threadId,
        user_id: userId,
        order: (lastPin?.order ?? 0) + 1,
      })
      .select('id, order, threadId:thread_id')
      .maybeSingle()
      .throwOnError();

    return pin;
  }

  async unpinThread(threadId: string, organizationId: number, userId: number) {
    const supabase = this.dbService.supabase;

    const { data: pin } = await supabase
      .from('thread_pins')
      .delete()
      .eq('organization_id', organizationId)
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .select('id, order, threadId:thread_id')
      .maybeSingle()
      .throwOnError();

    return pin;
  }

  async reorderPinedThread(
    updates: ReorderThreadDto[],
    organizationId: number,
    userId: number,
  ) {
    const supabase = this.dbService.supabase;

    const mappedUpdates = updates.map(({ threadId, ...pin }) => ({
      ...pin,
      thread_id: threadId,
      organization_id: organizationId,
      user_id: userId,
    }));

    const { data: pins } = await supabase
      .from('thread_pins')
      .upsert(mappedUpdates, { onConflict: 'id' })
      .select('id, order, threadId:thread_id')
      .throwOnError();

    return pins;
  }

  async getFolders(
    organizationId: number,
    userId: number,
  ): Promise<FolderWithThreadsSchema[]> {
    const supabase = this.dbService.supabase;

    const { data } = await supabase
      .from('folders')
      .select(
        'id,userId:user_id,name,color,global,module,threadFolders:thread_folders(thread:threads(id,last_message,modified_at,name,tag:tags(id,name,backgroundColor:background_color,textColor:text_color,createdAt:created_at,organizationId:organization_id,userId:user_id,context),user:users(id,firstName:first_name,lastName:last_name,email,image)))',
      )
      .eq('organization_id', organizationId)
      .eq('module', 'threads')
      .or(`user_id.eq.${userId},global.is.true`)
      .order('created_at', { ascending: true });

    return (data ?? []).map(({ threadFolders, ...folder }) => ({
      ...folder,
      threads: threadFolders
        .filter((folder) => folder.thread.user.id === userId)
        .map((threadFolder) => threadFolder.thread),
    }));
  }

  async createThreadFolder({
    organizationId,
    userId,
    color,
    name,
    global,
  }: Omit<CreateFolderDto, 'module'>) {
    const supabase = this.dbService.supabase;

    const { data: folder } = await supabase
      .from('folders')
      .insert({
        module: 'threads',
        organization_id: organizationId,
        user_id: userId,
        color,
        name,
        global,
      })
      .select(
        'id, module, color, name, global, organizationId:organization_id, userId:user_id',
      )
      .maybeSingle()
      .throwOnError();

    return folder;
  }

  async updateThreadFolder({
    organizationId,
    color,
    name,
    global,
    id,
  }: UpdateFolderDto) {
    const supabase = this.dbService.supabase;

    const { data: folder } = await supabase
      .from('folders')
      .update({ color, name, global })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(
        'id, module, color, name, global, organizationId:organization_id, userId:user_id',
      )
      .maybeSingle()
      .throwOnError();

    return folder;
  }

  async deleteThreadFolder({
    organizationId,
    id,
  }: Pick<UpdateFolderDto, 'id' | 'userId' | 'organizationId'>) {
    const supabase = this.dbService.supabase;

    const { data: folder } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(
        'id, module, color, name, global, organizationId:organization_id, userId:user_id',
      )
      .maybeSingle()
      .throwOnError();

    return folder;
  }

  async attachThreadToFolder({
    organizationId,
    userId,
    threadId,
    folderId,
  }: AttachThreadFolderDto) {
    const supabase = this.dbService.supabase;
    
    // Check if thread is already in folder
    const { data: existingThreadFolder } = await supabase
      .from('thread_folders')
      .select('id')
      .eq('thread_id', threadId)
      .eq('folder_id', folderId)
      .eq('user_id', userId)
      .maybeSingle();
    
    // If thread is already in folder, fetch and return the full object
    if (existingThreadFolder) {
      const { data: fullThreadFolder } = await supabase
        .from('thread_folders')
        .select('id, organizationId:organization_id, userId:user_id, threadId:thread_id, folderId:folder_id')
        .eq('id', existingThreadFolder.id)
        .single()
        .throwOnError();
      
      return fullThreadFolder;
    }

    const { data: threadFolder } = await supabase
      .from('thread_folders')
      .insert({
        thread_id: threadId,
        organization_id: organizationId,
        user_id: userId,
        folder_id: folderId,
      })
      .select(
        'id, organizationId:organization_id, userId:user_id, threadId:thread_id, folderId:folder_id',
      )
      .maybeSingle()
      .throwOnError();

    return threadFolder;
  }

  async detachThreadFromFolder({
    folderId,
    threadId,
    userId,
  }: {
    folderId: number;
    threadId: string;
    userId: number;
  }) {
    const supabase = this.dbService.supabase;

    const { data: threadFolder } = await supabase
      .from('thread_folders')
      .delete()
      .eq('folder_id', folderId)
      .eq('user_id', userId)
      .eq('thread_id', threadId)
      .select('*')
      .single()
      .throwOnError();

    return threadFolder;
  }

  async getMessagesFromResponses(response_id: string | null, threadId?: string) {
    // If there's a threadId provided, check if it's an agent run thread first
    if (threadId) {
      const { data: thread } = await this.dbService.supabase
        .from('threads')
        .select('agent_run, messages, agent_run_inputs, agent_run_outputs, agent_instance_id')
        .eq('id', threadId)
        .single();
      
      // If this is an agent thread with stored messages, return those directly
      if (thread?.agent_run && thread.messages) {
        // For agent threads, we already have the messages stored in the thread
        // We now format them to include agent info from agent_run_inputs and agent_run_outputs
        const formattedMessages = thread.messages as Array<{ role: string; content: string; sources: any[]; timestamp: string }>;
        
        // Ensure messages are in the correct order (user message first, then assistant)
        // This ensures proper chronological display even if UI reverses them
        formattedMessages.sort((a, b) => {
          if (a.role === 'user' && b.role === 'assistant') return -1;
          if (a.role === 'assistant' && b.role === 'user') return 1;
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
        
        // If it's an agent message and has user role, format it to show the inputs nicely
        if (thread.agent_run_inputs && formattedMessages.find(m => m.role === 'user')) {
          const userMessage = formattedMessages.find(m => m.role === 'user');
          if (userMessage) {
            // Format the user message to include all inputs in a readable format
            const inputs = thread.agent_run_inputs as {
              // Step 1 fields
              instanceName?: string;
              instructions?: string;
              additionalContext?: string;
              
              // Step 2 fields
              messageContext: string;
              platformType: string;
              customPlatform?: string;
              numberOfVariants: number;
              tone?: string;
              senderName?: string;
              documentIds?: string[];
            };
            
            // Update the content to format it nicely for display
            userMessage.content = `# Message Generator Request\n\n`;
            
            // Include all available fields
            if (inputs.instanceName) {
              userMessage.content += `**Instance Name**: ${inputs.instanceName}\n\n`;
            }
            
            if (inputs.instructions) {
              userMessage.content += `**Instructions**: ${inputs.instructions}\n\n`;
            }
            
            if (inputs.additionalContext) {
              let formattedContext = '';
              let shouldUseDefaultFormatting = true;
              
              // Check if the additionalContext might be a JSON string
              try {
                // If it's a string that looks like JSON, try to parse it
                if (typeof inputs.additionalContext === 'string' && 
                    inputs.additionalContext.trim().startsWith('{') && 
                    inputs.additionalContext.trim().endsWith('}')) {
                  const parsedContext = JSON.parse(inputs.additionalContext);
                  // If it has a userText field, use that instead
                  if (parsedContext && typeof parsedContext === 'object' && parsedContext.userText) {
                    formattedContext = parsedContext.userText;
                    shouldUseDefaultFormatting = false;
                  }
                }
              } catch (e) {
                // Not valid JSON, continue with normal formatting
              }
              
              // Regular string formatting if JSON parsing wasn't successful
              if (shouldUseDefaultFormatting) {
                formattedContext = inputs.additionalContext.toString().replace(/\\n/g, '\n');
              }
              
              userMessage.content += `**Additional Context**: ${formattedContext}\n\n`;
            }
            
            userMessage.content += `**Context**: ${inputs.messageContext}\n\n`;
            userMessage.content += `**Platform**: ${inputs.platformType}${inputs.customPlatform ? ` (${inputs.customPlatform})` : ''}\n\n`;
            
            if (inputs.tone) {
              userMessage.content += `**Tone**: ${inputs.tone}\n\n`;
            }
            
            userMessage.content += `**Variants Requested**: ${inputs.numberOfVariants}\n\n`;
            
            if (inputs.senderName) {
              userMessage.content += `**Sender Name**: ${inputs.senderName}\n\n`;
            }
            
            if (inputs.documentIds && inputs.documentIds.length > 0) {
              userMessage.content += `**Documents**: ${inputs.documentIds.length} document(s) attached\n\n`;
            }
          }
        }
        
        // If it has assistant messages with agent output, format them nicely
        if (thread.agent_run_outputs && formattedMessages.find(m => m.role === 'assistant')) {
          const assistantMessage = formattedMessages.find(m => m.role === 'assistant');
          if (assistantMessage) {
            const outputs = thread.agent_run_outputs as {
              messages: Array<{ number: number; content: string }>;
              platformType: string;
            };
            
            if (outputs.messages && outputs.messages.length > 0) {
              // Create a formatted output with all message variants
              assistantMessage.content = `# Generated Messages\n\n`;
              
              outputs.messages.forEach(msg => {
                assistantMessage.content += `## Message ${msg.number}\n\n${msg.content}\n\n`;
              });
            }
          }
        }
        
        return formattedMessages;
      }
    }
    
    // If not an agent thread or no threadId provided, proceed with normal response processing
    if (response_id == null || response_id == undefined || response_id == 'null') return [];
    const response = await this.openAiService.getThreadMessagesFromResponses(response_id);
    const responseObj = await this.openAiService.getResponse(response_id);
    const response_tool = responseObj.tools.find((tool) => tool.type === 'file_search');
    const is_clean_required = response_tool != undefined && (responseObj.model.includes('o3') || responseObj.model.includes('o4-mini'));
    
    const latest_response_messages: ResponseOutputMessage[] = (responseObj as any).output
        .filter((item): item is ResponseOutputMessage => item.type === 'message')
        .map((item): ResponseOutputMessage => item as ResponseOutputMessage);
    const latest_reasoning_items: ResponseReasoningItem[] = (responseObj as any).output
        .filter((item): item is ResponseReasoningItem => item.type === 'reasoning' && item.summary.length > 0)
        .map((item): ResponseReasoningItem => item as ResponseReasoningItem);
    response.data.unshift(...latest_response_messages);
    // Extract reasoning summary from response if present
    const reasoningSummary: string | undefined = latest_reasoning_items[0]?.summary.reduce((acc, curr) => acc + curr.text + '\n', '');
    // Build message objects and inject summary only on first assistant message
    const messages: Array<{ role: string; content: string; sources: any[]; timestamp: string; reasoningSummary?: string }> = [];
    let summaryInjected = false;
    for (const item of response.data) {
      if (item.type !== 'message') continue;
      const { role, content } = item;
      let textValue = '';
      let annotations: any[] = [];
      const textContentPart = content.find(
        (part): part is ResponseInputText | ResponseOutputText =>
          part.type === 'input_text' || part.type === 'output_text',
      );
      if (textContentPart) {
        textValue = textContentPart.text;
        // Clean the citation markers
        if (is_clean_required) {
          const citationPattern = /citeturn\d+file\d+/g;
          textValue = textValue.replace(citationPattern, '');
          // Remove (), [], {} and their contents
          textValue = textValue.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, '');
        }
        if (textContentPart.type === 'output_text') {
          annotations = textContentPart.annotations ?? [];
        }
      }
      const sources = (
        await Promise.allSettled(
          annotations.filter((a) => (a as any).type === 'file_citation').map(async (annotation) => {
            const fileId = (annotation as any).file_id;
            const filename = (await this.documentService.getDocument(fileId)).name;
            return { filename, text: '' };
          }),
        )
      )
        .filter(isFulfilled)
        .map(({ value }) => value);
      const msg: any = { role, content: textValue, sources, timestamp: new Date().toISOString() };
      if (!summaryInjected && role === 'assistant' && reasoningSummary) {
        msg.reasoningSummary = reasoningSummary;
        summaryInjected = true;
      }
      messages.push(msg);
    }
    return messages;
  }

  async generateName(message: string) {
    return await this.openAiService.prompt(
      `Generate a short chat thread title for the following message. Do not give your answer in quotes. Message: "${message}"`,
      {
        model: 'gpt-4.1-nano',
      },
    );
  }

  async createResponseAndPoll(
    response_id: string,
    tagId: number,
    organizationId: number,
    prompt: string,
    userId?: number,
    reasoningEffort?: 'low' | 'medium' | 'high',
  ) {
    // Load org's chosen model & temperature
    const { data: org } = await this.dbService.supabase
      .from('organizations')
      .select('ai_model,ai_temperature,ai_context')
      .eq('id', organizationId)
      .single();
    
    // Fetch user context and model if userId is provided
    let userContext: string | null = null;
    let userFirstName: string | null = null;
    let userLastName: string | null = null;
    let userPosition: string | null = null;
    let userModel: string | null = null;
    let userTemperature: number | null = null;
    
    if (userId) {
      const { data: user } = await this.dbService.supabase
        .from('users')
        .select('ai_user_context, first_name, last_name, profile, ai_user_model, ai_user_temperature')
        .eq('id', userId)
        .single();
      userContext = user?.ai_user_context;
      userFirstName = user?.first_name;
      userLastName = user?.last_name;
      userModel = user?.ai_user_model;
      userTemperature = typeof user?.ai_user_temperature === 'number' ? user.ai_user_temperature : null;
      // Extract position from profile if available
      try {
        if (user?.profile) {
          const profileData = JSON.parse(user.profile);
          userPosition = profileData?.position || null;
        }
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }

    // Combine contexts
    let instructions = org?.ai_context || '';
    if (userContext || userFirstName || userLastName || userPosition) {
      instructions = `ORGANIZATION CONTEXT: ${instructions}\n`;
      if (userFirstName) instructions += `USER FIRST NAME: ${userFirstName}\n`;
      if (userLastName) instructions += `USER LAST NAME: ${userLastName}\n`;
      if (userPosition) instructions += `USER POSITION: ${userPosition}\n`;
      if (userContext) instructions += `USER CONTEXT: ${userContext}`;
    }
    
    const model = userModel || org?.ai_model || 'gpt-4.1';
    const temperature = userTemperature != null ? userTemperature : (org?.ai_temperature != null ? org.ai_temperature : 0.5);
    const vectorStore = await this.vectorStoreService.get(
      tagId,
      organizationId,
    );
    // Build request args, only include temperature for models that support it
    const responseArgs: any = {
      input: [{ role: 'user', content: prompt }],
      instructions,
      model,
      tools: [{ type: "file_search", vector_store_ids: [vectorStore.id] }],
      previous_response_id: response_id,
    };
    // Only include temperature for models that support it
    const noTempModels = ['o1', 'o3', 'o3-mini', 'o4-mini'];
    if (temperature != null && !noTempModels.includes(model)) {
      responseArgs.temperature = temperature;
    }
    // Include reasoning effort and summary for supported reasoning models
    const reasoningModels = ['o1', 'o3', 'o3-mini', 'o4-mini'];
    if (reasoningEffort && reasoningModels.includes(model)) {
      responseArgs.reasoning = { effort: reasoningEffort, summary: 'auto' };
    }
    const response = await this.openAiService.createResponseAndPoll(responseArgs);
    const messages = await this.getMessagesFromResponses(response.id);
    return messages[0];
  }

  async streamResponses(
    response_id: string | null,
    tagId: number,
    organizationId: number,
    prompt: string,
    options?: {
      useWebSearch?: boolean;
      reasoningEffort?: 'low' | 'medium' | 'high';
      userId?: number;
    },
    attachmentIds?: string[],
  ) {
    // Load vector store and organization settings
    const vectorStore = await this.vectorStoreService.get(
      tagId,
      organizationId,
    );
    const { data: org } = await this.dbService.supabase
      .from('organizations')
      .select('ai_context,ai_model,ai_temperature')
      .eq('id', organizationId)
      .single();
    
    // Get tag context if available
    const { data: tag } = await this.dbService.supabase
      .from('tags')
      .select('context')
      .eq('id', tagId)
      .single();

    // Fetch user context and model if userId is provided
    let userContext: string | null = null;
    let userFirstName: string | null = null;
    let userLastName: string | null = null;
    let userPosition: string | null = null;
    let userModel: string | null = null;
    let userTemperature: number | null = null;
    
    if (options?.userId) {
      const { data: user } = await this.dbService.supabase
        .from('users')
        .select('ai_user_context, first_name, last_name, profile, ai_user_model, ai_user_temperature')
        .eq('id', options.userId)
        .single();
      userContext = user?.ai_user_context;
      userFirstName = user?.first_name;
      userLastName = user?.last_name;
      userModel = user?.ai_user_model;
      userTemperature = typeof user?.ai_user_temperature === 'number' ? user.ai_user_temperature : null;
      // Extract position from profile if available
      try {
        if (user?.profile) {
          const profileData = JSON.parse(user.profile);
          userPosition = profileData?.position || null;
        }
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }

    // Combine contexts in specific order
    let instructions = '';
    
    // Add tag context first if available
    if (tag?.context) {
      instructions += `TAG SPECIFIC CONTEXT:\n${tag.context}\n\n`;
    }
    
    // Add organization context
    instructions += `ORGANIZATION CONTEXT:\n${org?.ai_context || ''}\n\n`;
    
    // Add user context
    if (userContext || userFirstName || userLastName || userPosition) {
      if (userFirstName) instructions += `USER FIRST NAME: ${userFirstName}\n`;
      if (userLastName) instructions += `USER LAST NAME: ${userLastName}\n`;
      if (userPosition) instructions += `USER POSITION: ${userPosition}\n`;
      if (userContext) instructions += `USER CONTEXT: ${userContext}\n`;
    }

    instructions += 
    `\n\nIMPORTANT INSTRUCTIONS: 
    1. Prefer lists over tables when conveying information.
    2. Ensure formatting is clean, easy to read, and visually consistent and appealing.
    `;
    
    const model = userModel || org?.ai_model || 'gpt-4.1';
    const temperature = userTemperature != null ? userTemperature : (org?.ai_temperature != null ? org.ai_temperature : 0.5);

    // --- Attachment Handling --- 
    let messageInputContent: Array<
        | { type: 'input_text'; text: string } 
        | { type: 'input_image'; image_url: string } 
        | { type: 'input_file'; file_id: string }
    > = [{ type: 'input_text', text: prompt }];
    if (attachmentIds && attachmentIds.length > 0) {
      const { data: attachmentsData, error: attachmentsError } = await this.dbService.supabase
        .from('thread_attachments')
        .select('id, openai_file_id, mime_type, url')
        .in('id', attachmentIds);

      if (attachmentsError) {
        console.error('Error fetching attachment details:', attachmentsError);
        // Handle error appropriately, maybe throw or return an error stream event
      } else if (attachmentsData) {
        attachmentsData.forEach(att => {
          if (att.mime_type?.startsWith('image/') && att.url) {
            // Add image URL to message content using the correct input type
            messageInputContent.push({ 
              type: 'input_image', // Use 'input_image' type
              image_url: att.url
            });
          } else if (att.openai_file_id) {
            // Add text/document file ID to request attachments for file_search
            messageInputContent.push({ 
              type: 'input_file',
              file_id: att.openai_file_id,
            });
          }
        });
      }
    }
    // --- End Attachment Handling ---

    // Choose tool based on webSearch flag OR if text attachments are present
    // If text attachments are present, always include file_search tool
    const baseTools = options?.useWebSearch
      ? [{ type: 'web_search_preview' }]
      : [{ type: 'file_search', vector_store_ids: [vectorStore.id] }];
    
    // Build stream args; omit temperature for unsupported models
    const streamArgs: any = {
      input: [{ role: 'user', content: messageInputContent }],
      instructions,
      tools: baseTools,
      model,
      stream: true,
      ...(response_id ? { previous_response_id: response_id } : {}),
    };
    // Only include temperature for models that support it
    const skipTemp = ['o1', 'o3', 'o3-mini', 'o4-mini'];
    if (org?.ai_temperature != null && !skipTemp.includes(model)) {
      streamArgs.temperature = temperature;
    }
    // Include reasoning effort and summary for supported reasoning models
    const reasoningModels = ['o1', 'o3', 'o3-mini', 'o4-mini'];
    if (options?.reasoningEffort && reasoningModels.includes(model)) {
      streamArgs.reasoning = { effort: options.reasoningEffort, summary: 'auto' };
    }
    return (await this.openAiService.streamResponse(streamArgs)) as unknown as Stream<ResponseStreamEvent>;
  }

  async cancelLatestResponse(
    threadId: string,
    // If provided, we trust this ID and directly revert the DB
    // If undefined, we fetch the current DB state and try to find the previous ID via OpenAI API
    knownPreviousResponseId?: string | null,
  ) {
    let finalPreviousResponseId: string | null;

    if (knownPreviousResponseId !== undefined) {
      // We were given the ID to revert to (likely from an active stream cancellation)
      console.log(
        `Reverting thread ${threadId} directly to known previous response ID: ${knownPreviousResponseId}`,
      );
      finalPreviousResponseId = knownPreviousResponseId;
    } else {
      // No known previous ID provided, perform the fetch-based lookup
      console.log(
        `No known previous ID for thread ${threadId}, attempting fetch-based revert.`,
      );
      const chat = await this.dbService.supabase
        .from('threads')
        .select('id, openai_response_id')
        .eq('id', threadId)
        .single();

      const currentResponseId = chat.data?.openai_response_id;

      if (!currentResponseId) {
        console.warn(
          `No current response ID found for thread ${threadId} during fetch-based cancellation. Cannot revert.`,
        );
        return; // Nothing to revert
      }

      try {
        const response = await this.openAiService.getResponse(currentResponseId);
        finalPreviousResponseId = response.previous_response_id;
        console.log(
          `Found previous response ID ${finalPreviousResponseId} via fetch for current response ${currentResponseId}`,
        );
      } catch (error) {
        throw error;
      }
    }

    // Update the thread to point to the determined previous response ID (or null)
    await this.dbService.supabase
      .from('threads')
      .update({ openai_response_id: finalPreviousResponseId })
      .eq('id', threadId);

    console.log(
      `Updated thread ${threadId} openai_response_id to: ${finalPreviousResponseId}`,
    );

    // REMINDER: We are not deleting the OpenAI response itself.

    return;
  }

  // Save an uploaded file and record it in thread_attachments
  async saveAttachment(file: any, threadId: string) {
    const supabase = this.dbService.supabase;
    let openAiFileId: string | null = null; // Initialize OpenAI file ID

    console.log("file", file)

    // 1. Upload to Supabase Storage (always)
    const filePath = `${threadId}/${Date.now()}_${file.originalname}`;
    await supabase.storage.from('attachments').upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });
    const { data: storageData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);
    const publicUrl = storageData?.publicUrl;

    // 2. Conditionally upload to OpenAI for supported text-based types
    const supportedOpenAiMimeTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'text/html',
      'application/pdf',
      'application/json',
      // Add other types supported by OpenAI assistants file search if needed
      // e.g., 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' (docx),
      // 'application/vnd.openxmlformats-officedocument.presentationml.presentation' (pptx),
      // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' (xlsx)
    ];

    if (supportedOpenAiMimeTypes.includes(file.mimetype)) {
      try {
        console.log(`Uploading ${file.originalname} (${file.mimetype}) to OpenAI...`, typeof file);
        const fileForOpenAI = new File(
          [file.buffer], // The buffer containing file data
          file.originalname, // The original filename
          { type: file.mimetype } // The MIME type
        );
        const openAiFileResponse = await this.openAiService.createFile(fileForOpenAI, 'user_data');
        openAiFileId = openAiFileResponse.id;
        console.log(`Successfully uploaded to OpenAI, file ID: ${openAiFileId}`);
      } catch (error) {
        console.error(`Failed to upload file ${file.originalname} to OpenAI:`, error);
        // Decide if you want to proceed without OpenAI ID or throw an error
        // For now, we'll proceed and store null for openai_file_id
      }
    } else {
        console.log(`Skipping OpenAI upload for ${file.originalname} (${file.mimetype}) - unsupported type.`);
    }


    // 3. Insert DB record with Supabase URL and potentially OpenAI File ID
    const { data: insertData, error: insertError } = await supabase
      .from('thread_attachments')
      .insert({
        thread_id: threadId,
        url: publicUrl, // Store Supabase URL
        filename: file.originalname,
        mime_type: file.mimetype,
        openai_file_id: openAiFileId, // Store OpenAI ID (null if not uploaded)
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert thread attachment record:', insertError);
      // Handle potential deletion of uploaded files if DB insert fails
      // Rollback Supabase storage upload
       await supabase.storage.from('attachments').remove([filePath]);
       console.log(`Rolled back Supabase storage upload for ${filePath}`);

      // Optionally delete the OpenAI file if it was successfully uploaded before DB error
      if (openAiFileId) {
         try {
            await this.openAiService.deleteFile(openAiFileId);
            console.log(`Rolled back OpenAI file upload: ${openAiFileId}`);
         } catch (deleteError) {
            console.error(`Failed to rollback OpenAI file ${openAiFileId}:`, deleteError)
         }
      }
      throw insertError; // Re-throw the error after cleanup attempt
    }

    const record = insertData

    // 4. Transform DB record into AttachmentSchema (including openaiFileId)
    return {
      id: record.id,
      threadId: record.thread_id,
      url: record.url,
      filename: record.filename,
      mimeType: record.mime_type,
      openaiFileId: record.openai_file_id, // Include the new field
      createdAt: record.created_at,
    };
  }

  // Delete an attachment record and remove from storage
  async deleteAttachment(id: string) {
    const supabase = this.dbService.supabase;
    // Find record to get file path
    const { data: att } = await supabase
      .from('thread_attachments')
      .select('url, openai_file_id')
      .eq('id', id)
      .single();
    if (att?.openai_file_id) {
      await this.openAiService.deleteFile(att.openai_file_id);
    }
    if (att?.url) {
      // Extract path after bucket URL
      const path = att.url.split(`/attachments/`)[1];
      if (path) {
        await supabase.storage.from('attachments').remove([path]);
      }
    }
    // Delete DB record
    await supabase.from('thread_attachments').delete().eq('id', id);
  }

  async generateSuggestedPrompts(tagId: number, organizationId: number, userId?: number) {
    // Get tag info
    const tag = await this.tagService.getTagById(tagId);
    if (!tag) throw new Error('Tag not found');

    // Get organization context and settings
    const { data: org } = await this.dbService.supabase
      .from('organizations')
      .select('ai_context,ai_model,ai_temperature')
      .eq('id', organizationId)
      .single();
    
    // Get user context if userId provided
    let userContext = '';
    if (userId) {
      const { data: user } = await this.dbService.supabase
        .from('users')
        .select('ai_user_context, first_name, last_name, profile')
        .eq('id', userId)
        .single();
      
      if (user) {
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

    // Get vector store to access documents
    const vectorStore = await this.vectorStoreService.get(tagId, organizationId);

    // Fetch document names for this tag
    const { data: docsWithTag } = await this.dbService.supabase
      .from('documents')
      .select('name')
      .eq('organization_id', organizationId)
      .eq('tag_id', tagId);
    const docNames = (docsWithTag || []).map(doc => doc.name).filter(Boolean);
    const docNamesSection = docNames.length
      ? `\nEXAMPLES OF DOCUMENTS WITH THIS TAG:\n${docNames.map(name => `- ${name}`).join('\n')}`
      : '';

    // Build prompt for GPT to generate suggestions
    const prompt = `Given the following context, generate 4 suggested prompts, 18-20 words each, that would be helpful for starting a new chat. Make the prompts specific, actionable and as if written by a human AND THEY MUST BE ABLE TO BE COMPLETED WITH ONLY THE DOCUMENTS IN THE TAG.

ORGANIZATION CONTEXT: ${org?.ai_context || ''}

USER CONTEXT:
${userContext}

TAG NAME: ${tag.name}
${docNamesSection}

The prompts should be relevant to the tag "${tag.name}" and the user's role/context. Format the response as a simple list with one prompt per line, no numbers or bullets. Each prompt should be a complete, natural question or request that a user might ask. Make them varied but specific to this context.`;

    // Use GPT-4.1-nano for quick, focused response
    const suggestedPrompts = await this.openAiService.prompt(prompt, {
      model: 'gpt-4.1-nano',
    });

    // Split into array and clean up
    return suggestedPrompts
      .split('\n')
      .map(prompt => prompt.trim())
      .filter(prompt => prompt.length > 0);
  }
}
