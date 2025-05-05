import { FunctionComponent, PropsWithChildren, useMemo } from "react";
import Link from "next/link";
import { USER_SETTINGS_TABS, UserSettingsTab } from "@/routing/navigation/app";
import { useAuthContext } from "@/context/AuthContext";
import { useRoute } from "@/routing/useRoute";
import { USER_APP_ROUTES } from "@/routing/routes";

type Props = {
  activeTab: UserSettingsTab;
};

export const SettingsLayout: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
  activeTab,
}) => {
  const { isOrgAdmin } = useAuthContext();

  useRoute(USER_APP_ROUTES, {
    redirect: {
      onCondition: !isOrgAdmin && !!activeTab.adminOnly,
      toDefaultAuthenticatedPath: true,
    },
  });

  const tabs = useMemo(
    () =>
      USER_SETTINGS_TABS.filter((tab) => {
        if (isOrgAdmin) return true;
        if ("adminOnly" in tab && tab.adminOnly) return false;
      }),
    [isOrgAdmin],
  );

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-5xl mx-auto">
        {tabs.length > 0 && (
          <nav className="flex border-b border-gray-200 mb-4 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent -mx-4 px-2 md:mx-0 md:px-0">
            {tabs.map((tab) => (
              <Link
                href={tab.path}
                key={tab.id}
                className={`px-4 py-2 text-sm font-medium inline-block align-middle transition-colors duration-150 ease-in-out
                  ${activeTab.id === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700"}
                `}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        )}
        <div className="bg-white border rounded-lg p-6">{children}</div>
      </div>
    </div>
  );
};
