import { NextPage } from "next";
import { useAuthContext } from "@/context/AuthContext";
import { useRoute } from "@/routing/useRoute";
import { USER_APP_ROUTES } from "@/routing/routes";
import { AppSignInLayout } from "@/layouts/app/AppSignInLayout";

const AppLoginPage: NextPage = () => {
  const { user } = useAuthContext();

  useRoute(USER_APP_ROUTES, {
    redirect: {
      onCondition: !!user,
      toDefaultAuthenticatedPath: true,
    },
  });
  return <AppSignInLayout />;
};

export default AppLoginPage;
