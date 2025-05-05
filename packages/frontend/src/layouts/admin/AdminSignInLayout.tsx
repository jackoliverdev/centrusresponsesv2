import { FunctionComponent, PropsWithChildren } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { ADMIN_ROUTES, USER_APP_ROUTES } from '@/routing/routes';
import { useRoute } from '@/routing/useRoute';
import { SignInComponent } from '@/components/common/SignInComponent';

type Props = {};

export const AdminSignInLayout: FunctionComponent<
  PropsWithChildren<Props>
> = ({}) => {
  const { user, isPlatformAdmin } = useAuthContext();

  useRoute(ADMIN_ROUTES, {
    redirect: {
      onCondition: isPlatformAdmin,
      toDefaultAuthenticatedPath: true,
    },
  });

  useRoute(USER_APP_ROUTES, {
    redirect: {
      onCondition: !!user && !isPlatformAdmin,
      toDefaultAuthenticatedPath: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center mb-4">
        Sign in to the admin panel
      </h2>
      <SignInComponent />
    </div>
  );
};
