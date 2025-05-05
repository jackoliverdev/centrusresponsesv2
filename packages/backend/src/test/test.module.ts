import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { FirebaseAuthModule } from '@/firebase-auth/firebase-auth.module';
import { UserModule } from '@/user/user.module';
import { DBModule } from '@/db/db.module';

@Module({
  controllers: [TestController],
  imports: [FirebaseAuthModule, UserModule, DBModule],
})
export class TestModule {}
