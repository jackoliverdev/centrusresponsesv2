import { Injectable } from '@nestjs/common';
import TwilioSDK from 'twilio';
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse';

@Injectable()
export class TwilioService {
  public readonly twilio: TwilioSDK.Twilio;

  constructor() {
    this.twilio = new TwilioSDK.Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  createXMLMessageResponse(message: string) {
    const response = new MessagingResponse();
    response.message(message);
    return response.toString();
  }

  async sendWhatsappMessage(to: string, message: string) {
    await this.twilio.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
    });
  }
}
