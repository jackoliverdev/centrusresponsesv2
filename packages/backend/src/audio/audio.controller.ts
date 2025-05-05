import { Body, Controller, Post, Res } from '@nestjs/common';
import { OpenAiService } from '@/open-ai/open-ai.service';
import { Response } from 'express';
import { API } from 'common';
import { RequestBodyType } from 'common/src/api';
import { Readable } from 'stream';
import { Authorized } from '@/auth-guard/auth-guard';
import { User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';

@Controller()
@Authorized()
export class AudioController {
  constructor(private openAiService: OpenAiService) {}

  @Post(API.textToSpeech.path)
  async textToSpeech(
    @Body() { text }: RequestBodyType<typeof API.textToSpeech>,
    @Res() response: Response,
    @User() user: UserFromRequest,
  ) {
    try {
      const speechResponse = await this.openAiService.createSpeech(text);

      // Set appropriate headers
      response.set({
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      });

      // Convert ReadableStream to Node.js stream and pipe to response
      const readable = Readable.from(speechResponse.body);
      readable.pipe(response);
    } catch (error) {
      console.error('Error generating speech:', error);
      response.status(500).json({ error: 'Failed to generate speech' });
    }
  }
} 