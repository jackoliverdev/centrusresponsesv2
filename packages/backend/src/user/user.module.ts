import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';

import { DBService } from '@/db/db.service';
import { SendgridModule } from '@/sendgrid/sendgrid.module';
import { OrganizationService } from '@/organization/organization.service';
import { OrganizationModule } from '@/organization/organization.module';
import { TagModule } from '@/tag/tag.module';
import { AuthGuardModule } from '@/auth-guard/auth-guard.module';
import { VectorStoreModule } from '@/vector-store/vector-store.module';

@Module({
  controllers: [UserController],
  providers: [UserService, FirebaseAuthService, DBService, OrganizationService],
  imports: [
    VectorStoreModule,
    SendgridModule,
    forwardRef(() => TagModule),
    forwardRef(() => OrganizationModule),
    forwardRef(() => AuthGuardModule),
  ],
  exports: [UserService],
})
export class UserModule {}
