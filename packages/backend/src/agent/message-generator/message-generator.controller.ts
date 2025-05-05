import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Authorized } from '@/auth-guard/auth-guard';
import { User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { MessageGeneratorService } from './message-generator.service';
import { MessageGeneratorResultSchema } from 'common';
import { MessageGeneratorDto } from './dto/message-generator.dto';

@Controller('agent')
export class MessageGeneratorController {
  constructor(private readonly messageGeneratorService: MessageGeneratorService) {}

  @Post('message-generator/run')
  @Authorized()
  async runMessageGenerator(
    @Body() input: MessageGeneratorDto,
    @User() { organizationId, userId }: UserFromRequest,
  ): Promise<MessageGeneratorResultSchema> {
    return this.messageGeneratorService.runMessageGenerator({
      ...input,
      organizationId,
      userId,
    });
  }
} 