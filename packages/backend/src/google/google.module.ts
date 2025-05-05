import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleController } from './google.controller';
import { OrganizationModule } from '@/organization/organization.module';
import { StorageModule } from '@/storage/storage.module';
import { DocumentModule } from '@/document/document.module';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';

@Module({
  providers: [GoogleService],
  controllers: [GoogleController],
  imports: [OrganizationModule, StorageModule, DocumentModule, AuthGuardModule],
})
export class GoogleModule {}
