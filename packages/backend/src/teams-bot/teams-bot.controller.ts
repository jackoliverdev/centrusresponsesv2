import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { TeamsBotService } from './teams-bot.service';
import { ChatService } from '@/chat/chat.service';

@Controller('teams-bot')
export class TeamsBotController {
  constructor(
    private readonly teamsBotService: TeamsBotService,
    private chatService: ChatService,
  ) {}

  @Post('webhook')
  async webhook(@Body() body) {
    const {
      id: activityId,
      text,
      from: { id: memberId },
      conversation: { id: conversationId },
    } = z
      .object({
        id: z.string(),
        text: z.string(),
        from: z.object({
          id: z.string(),
        }),
        conversation: z.object({
          id: z.string(),
        }),
      })
      .parse(body);

    const { email } = await this.teamsBotService.getConversationMember(
      conversationId,
      memberId,
    );

    const response = await this.teamsBotService.handleMessage(email, text);
    await this.teamsBotService.sendMessage(
      conversationId,
      activityId,
      response,
    );
  }
}
