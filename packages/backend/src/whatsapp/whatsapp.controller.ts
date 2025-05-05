import { Body, Controller, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { TwilioService } from '@/twilio/twilio.service';
import { splitMessageIntoChunks } from './whatsapp.utils';
import { sleep } from 'openai/core';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private whatsappService: WhatsappService,
    private twilioService: TwilioService,
  ) {}

  @Post('/message')
  async message(
    @Body()
    {
      Body: body,
      MessageType,
      From,
    }: {
      Body: string;
      MessageType: 'text' | string;
      From: string;
    },
  ) {
    if (MessageType !== 'text') return;
    const number = From.replace('whatsapp:', '');
    await this.twilioService.sendWhatsappMessage(
      number,
      'Message received, generating response, please wait…',
    );
    const reply = await this.whatsappService.handleMessage(number, body);
    if (!reply) return;
    const chunks = splitMessageIntoChunks(reply);
    for (const chunk of chunks) {
      await this.twilioService.sendWhatsappMessage(number, chunk);
      await sleep(750);
    }
  }
}
