import { ChatService } from '@/chat/chat.service';
import { Injectable } from '@nestjs/common';
import { uniqBy } from 'lodash';
import NodeCache from 'node-cache';

@Injectable()
export class ChatbotService {
  private alreadyInteracted: NodeCache;

  constructor(private chatService: ChatService) {
    this.alreadyInteracted = new NodeCache({ checkperiod: 5 * 60 });
  }

  async formatMessage(
    message: Awaited<ReturnType<typeof ChatService.prototype.sendMessageUsingResponses>>,
  ) {
    const content = message.content;
    const sources =
      message.sources.length > 0
        ? `Sources
${uniqBy(message.sources, 'filename')
  .map(({ filename }) => `- ${filename}`)
  .join('\n')}
`
        : '';
    return `${content}\n\n${sources}`;
  }

  async messageHandler({
    message,
    getChat,
    getUser,
    createChat,
    deleteChat,
  }: {
    message: string;
    getUser: () => Promise<{ id: number; tags: string[] }>;
    getChat: () => Promise<{ id: string; tag: string }>;
    createChat: (tag: string) => Promise<undefined>;
    deleteChat: () => Promise<void>;
  }) {
    const chat = await getChat();
    if (chat) {
      if (chat.tag) {
        if (message == 'RESTART CHAT') {
          await deleteChat();
          const user = await getUser();
          if (user.tags.length == 0)
            return "Chat restarted, but you don't have any tags";
          return `Chat restarted! Please select a tag to start chatting again. (tags are case-sensitive): \n${user.tags.map((tag) => `- ${tag}`).join('\n')}`;
        } else {
          const reply = await this.chatService.sendMessageUsingResponses(chat.id, message);
          return await this.formatMessage(reply);
        }
      }
    } else {
      const user = await getUser();
      if (!user) return;
      if (user.tags.length == 0) return "You don't have any tags";

      if (!user.tags.includes(message)) {
        if (this.alreadyInteracted.has(user.id)) {
          return `Please select a valid tag (tags are case-sensitive): \n${user.tags.map((tag) => `- ${tag}`).join('\n')}`;
        } else {
          this.alreadyInteracted.set(user.id, true, 5 * 60);
          return `Hello
          
Please select a tag to start chatting (tags are case-sensitive): \n${user.tags.map((tag) => `- ${tag}`).join('\n')}

To change your data tag, type 'RESTART CHAT'.`;
        }
      }

      await createChat(message);
      return `Tag selected! How can I help you today?`;
    }
  }
}
