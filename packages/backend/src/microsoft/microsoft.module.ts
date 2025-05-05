import { Module } from '@nestjs/common';
import { MicrosoftService } from './microsoft.service';
import { MicrosoftController } from './microsoft.controller';
import { OrganizationModule } from '@/organization/organization.module';
import { DocumentModule } from '@/document/document.module';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';

@Module({
  providers: [MicrosoftService],
  controllers: [MicrosoftController],
  imports: [OrganizationModule, DocumentModule, AuthGuardModule],
})
export class MicrosoftModule {}
