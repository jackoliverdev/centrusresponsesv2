import { Module } from '@nestjs/common';
import { DBService } from '@/db/db.service';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';
import { UserModule } from '@/user/user.module';

/**
 * This module re-exports all the providers necessary
 * for all the guards and decorators here to work.
 *
 * You need to import this module in all the other routes.
 */
@Module({
  providers: [DBService, FirebaseAuthService],
  exports: [DBService, FirebaseAuthService, UserModule],
  imports: [UserModule],
})
export class AuthGuardModule {}
