import { Module, forwardRef } from '@nestjs/common';
import { MessageGeneratorController } from './message-generator.controller';
import { MessageGeneratorService } from './message-generator.service';
import { DBModule } from '@/db/db.module';
import { OpenAiModule } from '@/open-ai/open-ai.module';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { AgentModule } from '../agent.module';
import { VectorStoreModule } from '@/vector-store/vector-store.module';
import { DocumentModule } from '@/document/document.module';

@Module({
  imports: [
    DBModule, 
    OpenAiModule, 
    AuthGuardModule,
    VectorStoreModule,
    DocumentModule,
    forwardRef(() => AgentModule)
  ],
  controllers: [MessageGeneratorController],
  providers: [MessageGeneratorService],
  exports: [MessageGeneratorService],
})
export class MessageGeneratorModule {} 