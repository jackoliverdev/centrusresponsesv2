import { forwardRef, Module } from '@nestjs/common';
import { HelpContentService } from './help-content.service';
import { HelpContentController } from './help-content.controller';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { DBModule } from '@/db/db.module';

@Module({
  providers: [HelpContentService],
  controllers: [HelpContentController],
  imports: [
    DBModule,
    forwardRef(() => AuthGuardModule),
  ],
})
export class HelpContentModule {}
