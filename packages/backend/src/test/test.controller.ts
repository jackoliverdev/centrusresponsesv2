import { Controller, Post } from '@nestjs/common';
import { User } from '@/auth-guard/user.decorator';
import { Authorized } from '@/auth-guard/auth-guard';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { USER_ROLES } from 'common';
import { DBService } from '@/db/db.service';

@Controller('test')
export class TestController {
  constructor(private dbService: DBService) {}

  @Post('/admin')
  @Authorized({ requiredRoles: [USER_ROLES.admin] })
  async getOrCreateUser(
    @User()
    { firebaseUser, organizationId, roleInOrganization }: UserFromRequest,
  ) {
    return { firebaseUser, organizationId, roleInOrganization };
  }
}
