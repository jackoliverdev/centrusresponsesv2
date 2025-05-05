import { auth } from 'firebase-admin';
import DecodedIdToken = auth.DecodedIdToken;
import { UserRole } from 'common';

export type UserFromRequest = {
  userId?: number;
  email: string;
  firebaseUser: DecodedIdToken;
  organizationId: number | null;
  roleInOrganization: UserRole | null;
};
