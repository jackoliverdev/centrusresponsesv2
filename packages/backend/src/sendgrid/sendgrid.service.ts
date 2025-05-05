import { Injectable } from '@nestjs/common';
import sendgrid from '@sendgrid/mail';

@Injectable()
export class SendgridService {
  private sendgrid: sendgrid.MailService;
  constructor() {
    this.sendgrid = sendgrid;
    this.sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async send(data: Omit<sendgrid.MailDataRequired, 'from'> & { text: string }) {
    return await this.sendgrid.send({
      from: process.env.SENDGRID_EMAIL,
      ...data,
    });
  }
}
