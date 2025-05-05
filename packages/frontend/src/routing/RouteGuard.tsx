import { FunctionComponent, PropsWithChildren, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import {
  ADMIN_ROUTES,
  ORG_ADMIN_ROUTES,
  USER_APP_ROUTES,
} from '@/routing/routes';
import { LoadingLayout } from '@/layouts/LoadingLayout';
import { isRoleAllowed } from 'common';

type Props = object;

/**
 * This RouteGuard doesn't add any presentation, but ensure that routes are checked
 * against authentication, and users redirected appropriately.
 */
export const RouteGuard: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
}) => {
  const router = useRouter();
  const { user, isLoading, isPlatformAdmin } = useAuthContext();

  useEffect(() => {
    if (isLoading || !router.isReady) return;

    const adminUrlCheck = ADMIN_ROUTES.check(router.asPath);
    const userUrlCheck = USER_APP_ROUTES.check(router.asPath);
    const orgAdminUrlCheck = ORG_ADMIN_ROUTES.check(router.asPath);

    if (userUrlCheck.includes) {
      if (!user && userUrlCheck.isProtected) {
        router.replace(USER_APP_ROUTES.getDefaultPath());
        return;
      }
    }

    if (orgAdminUrlCheck.includes) {
      const userOrg = user?.organizations?.[0]?.role;

      if (!isRoleAllowed(userOrg, ['admin']) && orgAdminUrlCheck.isProtected) {
        router.replace(USER_APP_ROUTES.getDefaultPath());
        return;
      }
    }

    if (adminUrlCheck.includes) {
      if (!isPlatformAdmin && adminUrlCheck.isProtected) {
        router.replace(ADMIN_ROUTES.getDefaultPath());
        return;
      }
    }
  }, [isLoading, isPlatformAdmin, router, user]);

  if (isLoading) {
    return <LoadingLayout />;
  }

  return <>{children}</>;
};
