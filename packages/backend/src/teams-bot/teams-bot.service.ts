import { ChatService } from '@/chat/chat.service';
import { ChatbotService } from '@/chatbot/chatbot.service';
import { UserService } from '@/user/user.service';
import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

@Injectable()
export class TeamsBotService {
  private bot: AxiosInstance;
  private token?: {
    access_token: string;
    expiry_date: number;
  };

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private chatbotService: ChatbotService,
  ) {
    this.bot = axios.create({
      baseURL: 'https://smba.trafficmanager.net/teams/v3/',
    });
    this.bot.interceptors.request.use(async (request) => {
      const access_token = await this.getAccessToken();
      request.headers['Authorization'] = `Bearer ${access_token}`;
      return request;
    });
  }

  async getToken() {
    const { data } = await axios.post(
      'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
      {
        grant_type: 'client_credentials',
        client_id: process.env.TEAMS_BOT_CLIENT_ID,
        client_secret: process.env.TEAMS_BOT_CLIENT_SECRET,
        scope: 'https://api.botframework.com/.default',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return z
      .object({
        access_token: z.string(),
        expires_in: z.number(),
      })
      .parse(data);
  }

  async getAccessToken() {
    if (this.token && this.token.expiry_date > new Date().valueOf())
      return this.token.access_token;

    const token = await this.getToken();
    this.token = {
      access_token: token.access_token,
      expiry_date: new Date().valueOf() + (token.expires_in - 10) * 1000,
    };
    return this.token.access_token;
  }

  async sendMessage(
    conversationId: string,
    activityId: string,
    message: string,
  ) {
    await this.bot.post(
      `conversations/${conversationId}/activities/${activityId}`,
      {
        type: 'message',
        text: message,
      },
    );
  }

  async getConversationMember(conversationId: string, memberId: string) {
    const { data } = await this.bot.get(
      `conversations/${conversationId}/members/${memberId}`,
    );

    return z
      .object({
        email: z.string(),
      })
      .parse(data);
  }

  async handleMessage(email: string, message: string) {
    const getUser = async () => this.userService.findUserByEmail(email);
    const user = await getUser();
    return await this.chatbotService.messageHandler({
      message,
      getChat: () => this.chatService.findChatByTeamsEmail(email),
      getUser,
      createChat: async (tag) =>
        void (await this.chatService.createChatResponses(user.id, {
          teamsChat: true,
          tag,
        })),
      deleteChat: async () => await this.chatService.deleteTeamsChat(user.id),
    });
  }
}
