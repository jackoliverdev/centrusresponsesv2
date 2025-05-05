import { useEffect } from "react";
import { useRouter } from "next/router";
import { USER_APP_ROUTES } from "@/routing/routes";
import { NextPage } from "next";

const Custom404: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace(USER_APP_ROUTES.getDefaultPath());
  }, [router]);

  return null;
};

export default Custom404;
