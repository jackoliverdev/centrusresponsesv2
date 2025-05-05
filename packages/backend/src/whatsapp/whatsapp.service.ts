import { ChatService } from '@/chat/chat.service';
import { ChatbotService } from '@/chatbot/chatbot.service';
import { UserService } from '@/user/user.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private chatbotService: ChatbotService,
  ) {}

  async handleMessage(number: string, message: string): Promise<string> {
    const getUser = async () => this.userService.findUserByPhone(number);
    const user = await getUser();
    return await this.chatbotService.messageHandler({
      message,
      getChat: () => this.chatService.findChatByWhatsappNumber(number),
      getUser,
      createChat: async (tag) =>
        void (await this.chatService.createChatResponses(user.id, {
          whatsappChat: true,
          tag,
        })),
      deleteChat: async () =>
        await this.chatService.deleteWhatsappChat(user.id),
    });
  }
}
