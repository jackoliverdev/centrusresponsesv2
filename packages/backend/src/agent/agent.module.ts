import { Module, forwardRef } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentAdminController } from './agent-admin.controller';
import { AgentService } from './agent.service';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { DBModule } from '@/db/db.module';
import { OpenAiModule } from '@/open-ai/open-ai.module';
import { MessageGeneratorModule } from './message-generator/message-generator.module';

@Module({
  imports: [
    AuthGuardModule, 
    DBModule, 
    OpenAiModule, 
    forwardRef(() => MessageGeneratorModule),
  ],
  controllers: [AgentController, AgentAdminController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {} 