import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';
import { Reflector } from '@nestjs/core';
import { DBService } from '@/db/db.service';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { isRoleAllowed, UserRole } from 'common';
import { UserService } from '@/user/user.service';

/**
 * Metadata passed to the AuthGuard from the Authorized decorator.
 */
const PROTECTED_METADATA = {
  allowedRoles: 'allowedRoles',
};

type AuthorizedDecoratorParams = {
  requiredRoles?: UserRole[];
};
/**
 * Use this decorator on any route that needs to be protected
 * and authorized.
 *
 * The role is related to the organization ID that the request
 * contains in the header. If the user doesn't have that role in
 * that organization, the request won't go through.
 **/
export function Authorized(params?: AuthorizedDecoratorParams) {
  return applyDecorators(
    SetMetadata(PROTECTED_METADATA.allowedRoles, params?.requiredRoles ?? []),
    UseGuards(AuthGuard),
  );
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private firebaseAuthService: FirebaseAuthService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private dbService: DBService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles = this.reflector.get<UserRole[]>(
      PROTECTED_METADATA.allowedRoles,
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      return false;
    }

    try {
      const decodedToken = await this.firebaseAuthService.verifyIdToken(token);
      const parsedOrganizationId = parseInt(request.headers['organization-id']);

      const {
        id: userId,
        organizationId: userOrganizationId,
        role: roleInOrganization,
      } = await this.userService.getUserWithOrganizations(
        0,
        undefined,
        decodedToken.uid,
      );

      const organizationId = !isNaN(parsedOrganizationId)
        ? parsedOrganizationId
        : userOrganizationId;

      request['user'] = {
        userId,
        email: decodedToken.email,
        firebaseUser: decodedToken,
        organizationId,
        roleInOrganization,
      } satisfies UserFromRequest;

      if (allowedRoles?.length && roleInOrganization) {
        return isRoleAllowed(roleInOrganization, allowedRoles);
      }

      return true;
    } catch (e) {
      this.logger.error(
        `Something went wrong authenticating request with token '${token}' and organization-id '${request.headers['organization-id']}'`,
      );
      return false;
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
