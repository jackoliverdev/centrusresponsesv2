import { FunctionComponent, PropsWithChildren } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { USER_APP_ROUTES } from "@/routing/routes";
import { useRoute } from "@/routing/useRoute";
import { SignUpComponent } from "@/components/common/SignUpComponent";

type Props = {};

export const AppSignUpLayout: FunctionComponent<
  PropsWithChildren<Props>
> = ({}) => {
  const { user } = useAuthContext();

  useRoute(USER_APP_ROUTES, {
    redirect: {
      onCondition: !!user,
      toDefaultAuthenticatedPath: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center mb-4">Create an account</h2>
      <SignUpComponent />
    </div>
  );
};
