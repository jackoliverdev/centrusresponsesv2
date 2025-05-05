import { UserSchema } from 'common';

export const getUserLabel = (
  user: Pick<UserSchema, 'firstName' | 'lastName' | 'email'>,
) => [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
