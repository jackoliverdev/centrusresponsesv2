import { OrganizationId, User } from '@/auth-guard/user.decorator';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { API, RequestBodyType, ResponseBodyType } from 'common';
import { ChatService } from './chat.service';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { Authorized } from '@/auth-guard/auth-guard';
import { ChatOwner } from './chat.guard';
import { Response } from 'express';
import { OpenAiService } from '@/open-ai/open-ai.service';

@Controller()
export class ChatController {
  constructor(
    private chatService: ChatService,
    private openAiService: OpenAiService,
  ) {}

  @Authorized()
  @Post(API.createChat.path)
  async createChat(
    @User() user: UserFromRequest,
    @Body() { tag }: RequestBodyType<typeof API.createChat>,
  ): Promise<ResponseBodyType<typeof API.createChat>> {
    return await this.chatService.createChatResponses(user.userId, { tag });
  }

  @Authorized()
  @Post(API.getChats.path)
  async getChats(
    @User() user: UserFromRequest,
  ): Promise<ResponseBodyType<typeof API.getChats>> {
    return await this.chatService.getChats(user.userId);
  }

  @Authorized()
  @Post(API.getChat.path)
  async getChat(
    @User() user: UserFromRequest,
    @Body() { id }: RequestBodyType<typeof API.getChat>,
  ): Promise<ResponseBodyType<typeof API.getChat>> {
    return await this.chatService.getChatUsingResponses(id);
  }

  @ChatOwner()
  @Post(API.updateChat.path)
  async update(
    @Body() { id, data }: RequestBodyType<typeof API.updateChat>,
  ): Promise<ResponseBodyType<typeof API.updateChat>> {
    await this.chatService.update(id, data);
    return;
  }

  @ChatOwner()
  @Post(API.sendChatMessage.path)
  async sendMessage(
    @Body() { id, message, options, thread_attachment_ids }: RequestBodyType<typeof API.sendChatMessage>,
    @Res() response: Response,
  ): Promise<ResponseBodyType<typeof API.sendChatMessage>> {
    response.set({
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    });
    console.log(`ChatController.sendMessage: thread_attachment_ids=${thread_attachment_ids}`);
    const stream = await this.chatService.streamMessage(id, message, options, thread_attachment_ids);
    console.log(`ChatController.sendMessage: stream created for thread ${id}`);

    let buffer = ''; // Buffer for incoming delta text, handles partial citation patterns
    const citationPattern = /citeturn\d+file\d+/g;
    const citationStartSequence = ''; // Used for finding potential partial matches
    let aiMessage = ''; // Stores the original, uncleaned message
    let completedResponseId = null;

    for await (const event of stream) {
      console.log(`ChatController.sendMessage: received event type=${event.type}`);
      if (event.type == 'response.created') {
        const responseId = event.response.id;
        completedResponseId = responseId;
        await this.chatService.update(id, { openai_response_id: responseId });
        continue
      }
      if (
        event.type == 'response.completed' ||
        event.type == 'response.incomplete' ||
        event.type == 'response.failed'
      ) {
        // Clean the final accumulated message before saving
        const finalCleanedAiMessage = aiMessage.replace(citationPattern, '');
        await this.chatService.update(id, { openai_response_id: event.response.id });
        // Send any final bit left in the buffer before updating the message
        buffer = buffer.replace(citationPattern, ''); // Clean remaining buffer
        if (buffer.length > 0 && !buffer.startsWith(citationStartSequence)) {
             response.write(buffer);
             buffer = ''; // Clear buffer after writing
        }
        await this.chatService.updateLastMessage(id, finalCleanedAiMessage); // Save cleaned message
        // Finish the HTTP stream
        response.end();
        // Abort the underlying OpenAI stream immediately
        try {
          (stream as any).controller.abort();
        } catch {}
        // Remove this thread's active stream entry
        this.chatService.clearActiveStream(id);
        break;
      }
      if (event.type == 'response.output_text.done' || event.type == 'response.reasoning_summary_text.done' 
        || event.type == 'response.reasoning_summary_part.done'
      ) {
        response.write("\n");
      }
      if (event.type == 'response.output_text.delta' || event.type == 'response.reasoning_summary_text.delta') {
        // console.log("delta detected",event.type, event.delta); // Keep commented out unless debugging
        const newText = event.delta;
        aiMessage += newText; // Accumulate original message for final storage
        buffer += newText; // Add new text to the buffer

        // Remove any complete citation patterns found anywhere in the buffer
        buffer = buffer.replace(citationPattern, '');

        // Find the last potential start of a citation pattern
        const lastStartIndex = buffer.lastIndexOf(citationStartSequence);

        let textToSend = '';
        if (lastStartIndex === -1) {
          // No potential start found, the whole buffer is safe to send
          textToSend = buffer;
          buffer = ''; // Clear the buffer
        } else {
          // Potential start found, send only the text before it
          textToSend = buffer.substring(0, lastStartIndex);
          // Keep the potential start and anything after it in the buffer
          buffer = buffer.substring(lastStartIndex);
        }

        if (textToSend.length > 0) {
          response.write(textToSend);
        }
      }
    }
    // After the stream iterator finishes (e.g., natural end without completion event),
    // ensure the HTTP response is closed and stream cleaned up.
    // Also send any final buffered text.
    try {
      // Clean and send any final bit left in the buffer
      buffer = buffer.replace(citationPattern, '');
      if (buffer.length > 0 && !buffer.startsWith(citationStartSequence)) {
           response.write(buffer);
      }
      response.end();
    } catch {}
    this.chatService.clearActiveStream(id);
    // If the loop finished without a completion event, we might still need to update the message.
    // However, the primary logic handles this within the completion event block.
    // Consider if an update is needed here in edge cases. For now, assuming completion events are reliable.
    return;
  }

  @Authorized()
  @Post(API.getMessageStats.path)
  async chatStats(
    @Body() { start, end }: RequestBodyType<typeof API.getMessageStats>,
    @OrganizationId() organizationId: number,
  ): Promise<ResponseBodyType<typeof API.getMessageStats>> {
    return await this.chatService.getMessageStat(organizationId, {
      start,
      end,
    });
  }

  @Authorized()
  @Post(API.cancelChatMessage.path)
  async cancelChatMessage(
    @Body() { id }: RequestBodyType<typeof API.cancelChatMessage>,
  ): Promise<ResponseBodyType<typeof API.cancelChatMessage>> {
    await this.chatService.cancelMessage(id);
    return;
  }
}
