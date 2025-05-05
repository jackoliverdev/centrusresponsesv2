import { Injectable, BadRequestException } from '@nestjs/common';
import { DBService } from '@/db/db.service';
import { OpenAiService } from '@/open-ai/open-ai.service';
import { MessageGeneratorResultSchema } from 'common';
import { v4 as uuidv4 } from 'uuid';
import { MessageGeneratorDto } from './dto/message-generator.dto';
import { AgentService, AGENT_CREDIT_COSTS } from '../agent.service';
import { VectorStoreService } from '@/vector-store/vector-store.service';
import { DocumentService } from '@/document/document.service';
import {
  ResponseOutputMessage,
  ResponseOutputText,
  ResponseInputText,
  ResponseReasoningItem,
} from 'openai/resources/responses/responses';

@Injectable()
export class MessageGeneratorService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenAiService,
    private readonly agentService: AgentService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly documentService: DocumentService,
  ) {}

  async runMessageGenerator(input: MessageGeneratorDto & { organizationId: number; userId: number }): Promise<MessageGeneratorResultSchema> {
    const { 
      instanceId, 
      messageContext, 
      platformType, 
      customPlatform,
      numberOfVariants, 
      senderName,
      documentIds,
      organizationId,
      userId
    } = input;
    
    try {
      // Generate a thread ID that matches how chat service does it
      const threadId = `thread-${Date.now()}`;
      
      // CRITICAL: Add message credit usage FIRST, before any other operations
      // This ensures credits are used even if subsequent steps fail
      const creditCost = AGENT_CREDIT_COSTS['message_generator'] || 1;
      await this.agentService.addMessageStat(threadId, userId, organizationId, creditCost);
      
      // Get current usage and limits
      const currentUsage = await this.agentService.getCurrentMessageUsage(organizationId);
      const usageLimit = await this.agentService.getMessageLimit(organizationId);
      
      // Informational check since we already added the message stat
      if (currentUsage >= usageLimit) {
        console.warn('User has reached message limit');
      }
      
      // Get the agent instance
      const { data: instance } = await this.dbService.supabase
        .from('organization_agent_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (!instance) {
        throw new Error(`Agent instance with id ${instanceId} not found`);
      }

      // Get the agent details
      const { data: agent } = await this.dbService.supabase
        .from('agents')
        .select('*')
        .eq('id', instance.agent_id)
        .single();

      if (!agent) {
        throw new Error(`Agent with id ${instance.agent_id} not found`);
      }

      // Get document content if any
      let documentContext = '';
      let documentTools = [];

      if (documentIds && documentIds.length > 0) {
        // Fetch documents
        const { data: documents } = await this.dbService.supabase
          .from('documents')
          .select('*')
          .in('id', documentIds);

        if (documents && documents.length > 0) {
          // Get contents of documents from document service
          const docContents = await Promise.all(
            documents.map(async (doc) => {
              try {
                // Download the document and get its content using the document service
                const file = await this.documentService.getDocument(doc.id);
                return `## ${file.name}\n${file.path ? 'Content included from document' : '[Document content unavailable]'}`;
              } catch (error) {
                console.error(`Failed to get content for document ${doc.id}:`, error);
                return `## ${doc.name}\n[Document content unavailable]`;
              }
            })
          );
          
          documentContext = docContents.join('\n\n');
        }
      }

      // Determine which platform we're generating for
      let platformDescription = '';
      if (platformType === 'custom' && customPlatform) {
        platformDescription = `for ${customPlatform}`;
      } else {
        const platformMap = {
          'email': 'for email',
          'linkedin': 'for LinkedIn',
          'social_dm': 'for social media direct messages',
          'social_comment': 'for social media comments',
        };
        platformDescription = platformMap[platformType] || '';
      }

      // Create instructions for message generation
      const instructions = `
You are a professional message writer who excels at crafting contextually appropriate messages in British English (that means no Z) ${platformDescription}.

Instructions: ${instance.instructions}

Additional context: ${instance.context}

Background information:
${documentContext}

Format requirements:
1. Format each variant as a numbered message (starting with 1.)
2. Use proper markdown formatting where appropriate (bold for important points, lists for enumerations, etc.)
3. Each message should be well-structured with proper paragraphs and spacing
4. Make sure to include proper greeting/closing when appropriate for the platform
5. ${senderName ? `Use "${senderName}" as the sender's name in the closing` : 'Use [Sender\'s Name] as a placeholder in the closing'}
6. IMPORTANT: When signing off, put the closing phrase (e.g. "Best regards", "Thanks", "Cheers", "Kind regards", etc.) on a line by itself, then a blank line, and then the sender's name on its own line`;

      // Set up input for the response
      const input = [{
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Please generate ${numberOfVariants} different message variants for the following context:\n\n${messageContext}\n\n${senderName ? `Sender name: ${senderName}` : 'Use [Sender\'s Name] as a placeholder for the sender\'s name'}`
          }
        ]
      }];
      
      // Generate content using OpenAI Responses API
      const modelName = agent.model || 'o3-mini';
      const temperature = agent.temperature || 1;
      
      // Only include temperature for models that support it
      const noTempModels = ['o1', 'o3', 'o3-mini', 'o4-mini'];
      const responseArgs: any = {
        model: modelName,
        input,
        instructions,
        tools: documentTools,
      };

      if (!noTempModels.includes(modelName)) {
        responseArgs.temperature = temperature;
      }

      // Add reasoning for supported models
      const reasoningModels = ['o1', 'o3', 'o3-mini', 'o4-mini'];
      if (reasoningModels.includes(modelName)) {
        responseArgs.reasoning = { effort: 'medium', summary: 'auto' };
      }

      const response = await this.openAiService.createResponseAndPoll(responseArgs);

      // Extract message variants from the response
      const messageVariants = this.parseResponseOutput(response, numberOfVariants);
      
      // Create a thread for this agent run
      // Get or create agent tag
      const agentTag = await this.agentService.getOrCreateAgentTag(organizationId);
      console.log('Agent tag created/found:', agentTag);  // Log the tag details
      
      // Create a nice name for the thread
      const threadName = `${agent.name}: ${instance.name}`;
      
      // Format the user message and AI response for the thread
      const userMessage = {
        role: 'user',
        content: `Agent: ${agent.name}\nInstance: ${instance.name}\nPlatform: ${platformType}\nContext: ${messageContext}${senderName ? `\nSender: ${senderName}` : ''}${documentIds && documentIds.length > 0 ? `\nDocuments: ${documentIds.length} attached` : ''}`,
        sources: [],
        timestamp: new Date().toISOString()
      };
      
      // Format the assistant message
      const assistantMessage = {
        role: 'assistant',
        content: messageVariants.map((variant, index) => `Message ${index + 1}:\n${variant}`).join('\n\n'),
        sources: [],
        timestamp: new Date().toISOString()
      };
      
      // Create the thread
      console.log(`Updating thread ${threadId} with agent data using upsert`);
      const { data: updatedThread, error: upsertError } = await this.dbService.supabase
        .from('threads')
        .upsert({
          id: threadId,
          user_id: userId,
          tag_id: agentTag.id,
          tag: agentTag.name,
          whatsapp_thread: false,
          teams_thread: false,
          name: threadName,
          last_message: 'Message generated',
          modified_at: new Date().toISOString(),
          messages: [userMessage, assistantMessage],
          openai_response_id: response.id,
          agent_run: true,
          agent_instance_id: instanceId,
          agent_run_inputs: {
            // Step 1 fields (from instance)
            instanceName: instance.name,
            instructions: instance.instructions, 
            additionalContext: this.extractUserTextFromContext(instance.context),
            
            // Step 2 fields (from input)
            messageContext,
            platformType,
            customPlatform,
            numberOfVariants,
            tone: "professional", // Default to professional
            senderName,
            documentIds
          },
          agent_run_outputs: {
            messages: messageVariants.map((content, i) => ({
              number: i + 1,
              content,
            })),
            platformType
          }
        }, { onConflict: 'id' })
        .select()
        .single();
        
      if (upsertError) {
        console.error('Error updating thread with agent data:', upsertError);
      } else {
        console.log('Thread successfully updated with agent data:', updatedThread?.id);
      }
      
      // Create a result ID
      const resultId = uuidv4();
      
      // Return the result
      return {
        id: resultId,
        instanceId,
        results: {
          messages: messageVariants.map(content => ({ type: 'message', content })),
          platformType
        },
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Message generator failed:', error);
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to generate messages');
    }
  }

  private parseResponseOutput(response: any, expectedCount: number): string[] {
    // Extract messages from response output
    const messages: ResponseOutputMessage[] = response.output
      .filter((item: any): item is ResponseOutputMessage => item.type === 'message')
      .map((item: any): ResponseOutputMessage => item as ResponseOutputMessage);

    // Extract reasoning summary if present
    const reasoningItems: ResponseReasoningItem[] = response.output
      .filter((item: any): item is ResponseReasoningItem => item.type === 'reasoning' && item.summary.length > 0)
      .map((item: any): ResponseReasoningItem => item as ResponseReasoningItem);

    const reasoningSummary = reasoningItems[0]?.summary.reduce((acc, curr) => acc + curr.text + '\n', '');

    // Process each message to extract text content
    const processedMessages: string[] = [];
    let summaryInjected = false;

    for (const message of messages) {
      let textValue = '';
      let annotations: any[] = [];

      // Find the text content part
      const textContentPart = message.content.find(
        (part): part is ResponseOutputText => part.type === 'output_text'
      );

      if (textContentPart) {
        textValue = textContentPart.text;
        
        // Clean citation markers if needed
        const responseTool = response.tools.find((tool: any) => tool.type === 'file_search');
        const isCleanRequired = responseTool != undefined && (response.model.includes('o3') || response.model.includes('o4-mini'));
        
        if (isCleanRequired) {
          const citationPattern = /citeturn\d+file\d+/g;
          textValue = textValue.replace(citationPattern, '');
          // Remove (), [], {} and their contents
          textValue = textValue.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, '');
        }

        annotations = textContentPart.annotations ?? [];
      }

      // Add reasoning summary to first assistant message if present
      if (!summaryInjected && message.role === 'assistant' && reasoningSummary) {
        textValue = `${reasoningSummary}\n\n${textValue}`;
        summaryInjected = true;
      }

      if (textValue) {
        processedMessages.push(textValue);
      }
    }

    // If we don't have enough messages, try to parse the content further
    if (processedMessages.length < expectedCount) {
      const combinedText = processedMessages.join('\n\n');
      return this.parseMessageVariants(combinedText, expectedCount);
    }

    return processedMessages.slice(0, expectedCount);
  }

  private parseMessageVariants(content: string, expectedCount: number): string[] {
    // This is a simple parser that extracts numbered message variants
    // It looks for patterns like "1.", "2.", etc.
    const variants: string[] = [];
    
    // Split by lines and look for number patterns
    const lines = content.split('\n');
    let currentVariant = '';
    let currentVariantNumber = 0;
    let inVariant = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines at the beginning
      if (!inVariant && line === '') continue;
      
      // Check if this line starts a new variant - looking for patterns like "1." or "Variant 1:" etc.
      const variantMatch = line.match(/^(?:variant\s+)?(\d+)[\.\:\)]|^message\s+(\d+)[\.\:]|^option\s+(\d+)[\.\:]/i);
      
      if (variantMatch) {
        // Get the variant number from whichever group matched
        const variantNumber = parseInt(variantMatch[1] || variantMatch[2] || variantMatch[3]);
        
        // If we were already building a variant, save it
        if (currentVariant && currentVariantNumber > 0) {
          variants.push(currentVariant.trim());
          currentVariant = '';
        }
        
        // Start a new variant - preserve any text after the number as part of the content
        inVariant = true;
        currentVariantNumber = variantNumber;
        // Replace the variant marker but preserve the rest of the line
        currentVariant = line.replace(/^(?:variant\s+)?(\d+)[\.\:\)]|^message\s+(\d+)[\.\:]|^option\s+(\d+)[\.\:]/i, '').trim();
        
        // If there's content after the marker, add it with a newline
        if (currentVariant) {
          currentVariant += '\n';
        }
      } else if (inVariant) {
        // Continue building the current variant
        if (line || i < lines.length - 1) { // Preserve empty lines except at the end
          currentVariant += line + '\n';
        }
      }
    }
    
    // Add the last variant if there is one
    if (currentVariant && currentVariantNumber > 0) {
      variants.push(currentVariant.trim());
    }
    
    // If parsing failed or didn't find the expected number of variants,
    // try a more aggressive approach to find message blocks
    if (variants.length !== expectedCount) {
      // Look for blocks separated by multiple newlines or message/variant indicators
      const blocks = content.split(/\n{2,}|(?=^(?:variant\s+)?\d+[\.\:]|^message\s+\d+[\.\:]|^option\s+\d+[\.\:])/im);
      
      variants.length = 0;
      for (const block of blocks) {
        const trimmed = block.trim();
        if (trimmed && !trimmed.match(/^(?:please|here are|i've created)/i)) {
          variants.push(trimmed);
        }
      }
      
      // If we still don't have enough variants, try one more fallback approach
      if (variants.length !== expectedCount) {
        // Split the content by double newlines and try to find message blocks
        const fallbackSplits = content.split(/\n\s*\n/);
        for (const split of fallbackSplits) {
          const trimmed = split.trim();
          if (trimmed) {
            variants.push(trimmed);
          }
        }
      }
    }
    
    // Clean up each variant to ensure it doesn't have leading numbers
    const cleanedVariants = variants.map(variant => {
      // Remove any leading variant/message number if present
      return variant.replace(/^(?:variant\s+)?\d+[\.\:\)]|^message\s+\d+[\.\:]|^option\s+\d+[\.\:]/i, '').trim();
    });
    
    // If we still don't have the right number, just return what we have, but limit to expected count
    return cleanedVariants.slice(0, expectedCount);
  }

  /**
   * Get current message usage for an organization - same as chat service
   */
  async getCurrentUsage(organizationId: number) {
    return this.agentService.getCurrentMessageUsage(organizationId);
  }

  private extractUserTextFromContext(context: any): string | undefined {
    if (!context) return undefined;
    
    // If it's already an object, try to get userText property
    if (typeof context === 'object' && context !== null) {
      return context.userText || '';
    }
    
    // If it's a string, try to parse it as JSON if it looks like JSON
    if (typeof context === 'string') {
      try {
        if (context.trim().startsWith('{') && context.trim().endsWith('}')) {
          const parsed = JSON.parse(context);
          if (parsed && typeof parsed === 'object' && parsed.userText) {
            return parsed.userText;
          }
        }
      } catch (e) {
        // Not valid JSON, just return the string as is
      }
      
      // If not JSON or parsing failed, just return the string with newlines fixed
      return context.replace(/\\n/g, '\n');
    }
    
    return '';
  }
} 