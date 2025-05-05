import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ChatModule } from '@/chat/chat.module';
import { UserModule } from '@/user/user.module';
import { TwilioModule } from '@/twilio/twilio.module';
import { ChatbotModule } from '@/chatbot/chatbot.module';

@Module({
  providers: [WhatsappService],
  controllers: [WhatsappController],
  imports: [ChatModule, UserModule, TwilioModule, ChatbotModule],
})
export class WhatsappModule {}
