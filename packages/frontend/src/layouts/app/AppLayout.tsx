import {
  FunctionComponent,
  PropsWithChildren,
  ReactNode,
  useMemo,
} from "react";
import { useAuthContext } from "@/context/AuthContext";
import {
  APP_NAVIGATION_ITEMS,
  NavigationItemId,
} from "@/routing/navigation/app";
import { NavigationItem } from "@/routing/navigation/types";
import { useRoute } from "@/routing/useRoute";
import { USER_APP_ROUTES } from "@/routing/routes";
import { Sidebar } from "./AppLayout/Sidebar";
import { twMerge } from "tailwind-merge";
import { Loader } from "@/components/ui/loader";

type Props = {
  currentItemId: NavigationItemId;
  action?: ReactNode;
  subtitle?: string;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  loading?: boolean;
};

export const AppLayout: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
  currentItemId,
  action,
  className,
  subtitle,
  containerClassName,
  headerClassName,
  loading,
}) => {
  const currentItem = useMemo(
    () =>
      APP_NAVIGATION_ITEMS.find(
        (i) => i.id === currentItemId,
      ) as NavigationItem,
    [currentItemId],
  );

  const { isOrgAdmin } = useAuthContext();

  useRoute(USER_APP_ROUTES, {
    redirect: {
      onCondition: !isOrgAdmin && !!currentItem.adminOnly,
      toDefaultAuthenticatedPath: true,
    },
  });

  return (
    <div
      className={twMerge(
        "flex lg:flex-row flex-col min-h-screen bg-gray-100",
        containerClassName,
      )}
    >
      <Sidebar currentItemId={currentItemId} routes={APP_NAVIGATION_ITEMS} />
      <main
        className={twMerge(
          "flex-grow flex flex-col gap-y-4 lg:gap-y-8 overflow-y-scroll pb-8",
          className,
        )}
      >
        <div className={twMerge("bg-background border-b", headerClassName)}>
          <div className="container flex sm:items-center justify-between sm:flex-row flex-col gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{currentItem.name}</h1>
              {(subtitle || currentItem.subtitle) && (
                <p className="text-gray-600">
                  {subtitle ?? currentItem.subtitle}
                </p>
              )}
            </div>
            {action}
            {currentItem?.content && <div>{currentItem.content}</div>}
          </div>
        </div>
        {loading ? <Loader className="mx-auto mt-24" /> : children}
      </main>
    </div>
  );
};
