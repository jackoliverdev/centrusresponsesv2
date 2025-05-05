import { forwardRef, Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { DBModule } from '@/db/db.module';

@Module({
  providers: [TagService],
  controllers: [TagController],
  imports: [
    DBModule,
    forwardRef(() => AuthGuardModule),
  ],
  exports: [TagService]
})
export class TagModule {}
