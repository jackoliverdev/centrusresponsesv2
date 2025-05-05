import {
  FunctionComponent,
  PropsWithChildren,
  ReactNode,
  useMemo,
} from "react";
import { ADMIN_ROUTES } from "@/routing/routes";
import { useAuthContext } from "@/context/AuthContext";
import { twMerge } from "tailwind-merge";
import { Sidebar } from "@/layouts/app/AppLayout/Sidebar";
import { Loader } from "@/components/ui/loader";
import { NavigationItem } from "@/routing/navigation/types";
import { useRoute } from "@/routing/useRoute";
import {
  ADMIN_NAVIGATION_ITEMS,
  NavigationItemId,
} from "@/routing/navigation/admin";

type Props = {
  currentItemId: NavigationItemId;
  action?: ReactNode;
  subtitle?: string;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  loading?: boolean;
};

export const AdminLayout: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
  currentItemId,
  action,
  className,
  subtitle,
  containerClassName,
  headerClassName,
  loading,
}) => {
  const { isPlatformAdmin } = useAuthContext();

  const currentItem = useMemo(
    () =>
      ADMIN_NAVIGATION_ITEMS.find(
        (i) => i.id === currentItemId,
      ) as NavigationItem,
    [currentItemId],
  );

  useRoute(ADMIN_ROUTES, {
    redirect: {
      onCondition: !isPlatformAdmin,
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
      <Sidebar
        currentItemId={currentItemId}
        routes={ADMIN_NAVIGATION_ITEMS}
        isPlatformDashboard
      />
      <main
        className={twMerge(
          "flex-grow flex flex-col gap-y-3 lg:gap-y-4 overflow-y-scroll pb-8",
          className,
        )}
      >
        <div className={twMerge("bg-background border-b", headerClassName)}>
          <div className="container flex sm:items-center justify-between sm:flex-row flex-col gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{currentItem.title ?? currentItem.name}</h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
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
