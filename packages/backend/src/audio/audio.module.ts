import { Module } from '@nestjs/common';
import { AudioController } from './audio.controller';
import { OpenAiModule } from '@/open-ai/open-ai.module';
import { FirebaseAuthModule } from '@/firebase-auth/firebase-auth.module';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { UserModule } from '@/user/user.module';
import { DBModule } from '@/db/db.module';

@Module({
  imports: [
    OpenAiModule,
    FirebaseAuthModule,
    AuthGuardModule,
    UserModule,
    DBModule,
  ],
  controllers: [AudioController],
})
export class AudioModule {} 