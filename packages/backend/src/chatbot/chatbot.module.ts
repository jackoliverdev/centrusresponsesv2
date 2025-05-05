import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatModule } from '@/chat/chat.module';

@Module({
  providers: [ChatbotService],
  exports: [ChatbotService],
  imports: [ChatModule],
})
export class ChatbotModule {}
