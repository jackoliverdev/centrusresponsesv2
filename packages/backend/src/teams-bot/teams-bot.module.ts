import { Module } from '@nestjs/common';
import { TeamsBotService } from './teams-bot.service';
import { TeamsBotController } from './teams-bot.controller';
import { ChatModule } from '@/chat/chat.module';
import { ChatbotModule } from '@/chatbot/chatbot.module';
import { UserModule } from '@/user/user.module';

@Module({
  providers: [TeamsBotService],
  controllers: [TeamsBotController],
  imports: [ChatModule, ChatbotModule, UserModule],
})
export class TeamsBotModule {}
