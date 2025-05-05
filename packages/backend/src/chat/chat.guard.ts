// chat-owner.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/auth-guard/auth-guard';

@Injectable()
export class ChatOwnerGuard implements CanActivate {
  constructor(private chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.userId;
    const chatId = request.body.id;

    if (!chatId) return true;

    const chat = await this.chatService.getChatUsingResponses(chatId);

    if (!chat) {
      throw new UnauthorizedException('Chat not found');
    }

    if (chat.user_id !== userId) {
      throw new UnauthorizedException('User is not the owner of this chat');
    }

    return true;
  }
}

export function ChatOwner() {
  return applyDecorators(UseGuards(AuthGuard, ChatOwnerGuard));
}
