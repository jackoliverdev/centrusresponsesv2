import { Module } from '@nestjs/common';
import { DocumentFolderController } from './document-folder.controller';
import { DocumentFolderService } from './document-folder.service';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { DBModule } from '@/db/db.module';

@Module({
  imports: [AuthGuardModule, DBModule],
  controllers: [DocumentFolderController],
  providers: [DocumentFolderService],
  exports: [DocumentFolderService],
})
export class DocumentFolderModule {}