import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserFromRequest } from './auth-guard.types';

/**
 * Decorator to get all the user information injected
 * into the request by the auth guard.
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const OrganizationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserFromRequest;
    return user.organizationId;
  },
);
