import { FunctionComponent, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowRightLeftIcon, ChevronLeft, LogOut } from "lucide-react";
import { getUserLabel } from "@/utils/user";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { Drawer, Tooltip } from "antd";
import { CloseOutlined, MenuOutlined } from "@ant-design/icons";
import { twMerge } from "tailwind-merge";
import { useSessionStorage } from "@uidotdev/usehooks";
import { NavigationItem } from "@/routing/navigation/types";
import { ADMIN_ROUTES, USER_APP_ROUTES } from "@/routing/routes";

export type SidebarProps = {
  currentItemId: string;
  routes: NavigationItem[];
  isPlatformDashboard?: boolean;
};

export const Sidebar: FunctionComponent<SidebarProps> = ({
  currentItemId,
  routes,
  isPlatformDashboard,
}) => {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useSessionStorage(
    "sidebarCollapsed",
    false,
  );
  const { signOut, user, isOrgAdmin, isPlatformAdmin } = useAuthContext();

  const sidebarItems = (
    <nav className="flex-grow">
      <ul className="space-y-3">
        {routes
          .filter((item) => {
            const adminOnly = "adminOnly" in item ? item.adminOnly : false;
            if (isOrgAdmin) return true;
            return !adminOnly;
          })
          .map((item) => (
            <li key={item.id}>
              <Tooltip title={collapsed ? item.name : ""} placement="right">
                {item.path && (
                  <Link
                    href={item.path}
                    className={`flex items-center w-full py-3 px-4 rounded-lg gap-3 font-medium ${
                      currentItemId === item.id
                        ? "bg-blue-800 text-white"
                        : "hover:bg-blue-800 text-gray-300"
                    }`}
                  >
                    <item.Icon className="h-5 w-5" />
                    <span className={twMerge(collapsed && "lg:hidden")}>
                      {item.name}
                    </span>
                  </Link>
                )}
                {"externalHref" in item && (
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={item.externalHref}
                    className={`flex items-center w-full py-3 px-4 rounded-lg gap-3 ${
                      currentItemId === item.id
                        ? "bg-blue-800 text-white"
                        : "hover:bg-blue-800 text-gray-300"
                    }`}
                  >
                    <item.Icon className="h-5 w-5" />
                    <span className={twMerge(collapsed && "lg:hidden")}>
                      {item.name}
                    </span>
                  </a>
                )}
              </Tooltip>
            </li>
          ))}
      </ul>
    </nav>
  );

  const platformSwitchButtons =
    isPlatformAdmin &&
    (isPlatformDashboard ? (
      <Tooltip title={collapsed ? "Switch to user app" : ""} placement="right">
        <Link
          className={twMerge(
            "flex items-center py-3 px-4 mx-2 rounded-lg gap-3 font-medium hover:bg-blue-800 text-gray-300",
            collapsed && "lg:justify-center",
          )}
          href={USER_APP_ROUTES.getDefaultPath({}, true)}
        >
          <ArrowRightLeftIcon className="h-5 w-5" />
          <span className={twMerge(collapsed && "lg:hidden")}>User app</span>
        </Link>
      </Tooltip>
    ) : (
      <Tooltip
        title={collapsed ? "Switch to platform admin app" : ""}
        placement="right"
      >
        <Link
          className={twMerge(
            "flex items-center py-3 px-4 mx-2 rounded-lg gap-3 font-medium hover:bg-blue-800 text-gray-300",
            collapsed && "lg:justify-center",
          )}
          href={ADMIN_ROUTES.getDefaultPath({}, true)}
        >
          <ArrowRightLeftIcon className="h-5 w-5" />
          <span className={twMerge(collapsed && "lg:hidden")}>
            Platform Admin app
          </span>
        </Link>
      </Tooltip>
    ));

  const sidebarContent = (
    <aside
      className={twMerge(
        "w-64 bg-primary text-white flex flex-col sticky top-0 h-screen",
        collapsed && "w-auto",
      )}
    >
      <div className="py-6 px-4 relative overflow-y-auto">
        <div className="flex items-center mb-10">
          <Link href={USER_APP_ROUTES.getPath('dashboard')}>
            <Logo
              className={twMerge("h-10", collapsed && "mx-auto")}
              iconOnly={collapsed}
            />
          </Link>
        </div>
        {sidebarItems}
      </div>

      <div className="mt-auto">
        {platformSwitchButtons}

        <div className="flex items-center border-b border-white/30 py-6 px-3">
          <Avatar
            src={user?.image}
            size={40}
            className={twMerge(collapsed ? "mx-auto" : "mr-3")}
          />
          {!collapsed && (
            <div>
              <p className="font-semibold">{user && getUserLabel(user)}</p>
              <p className="text-sm text-gray-300">{user?.profile?.position}</p>
            </div>
          )}
        </div>
        <Tooltip title={collapsed ? "Logout" : ""} placement="right">
          <button
            className={twMerge(
              "flex items-center w-full px-4 py-6 pl-6 rounded hover:bg-blue-800",
              collapsed && "justify-center",
            )}
            onClick={signOut}
          >
            <LogOut className="mr-3 h-5 w-5" />
            {!collapsed && <span>Log out</span>}
          </button>
        </Tooltip>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute right-0 translate-x-1/2 top-10 size-6 rounded-full bg-blue-200 shadow-lg text-primary flex items-center justify-center z-20 "
      >
        <ChevronLeft className={twMerge("size-4", collapsed && "rotate-180")} />
      </button>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block relative">{sidebarContent}</div>
      <div className="lg:hidden bg-primary flex items-center justify-between py-4 px-6">
        <Link 
          href={USER_APP_ROUTES.getPath('dashboard')}
          onClick={() => {
            if (currentItemId === 'dashboard') {
              setOpen(false);
            }
          }}
        >
          <Logo className="w-20" />
        </Link>
        <div className="flex items-center gap-5">
          <Avatar src={user?.image} size={40} />
          <button onClick={() => setOpen(true)}>
            <MenuOutlined className="text-white" />
          </button>
        </div>
      </div>
      <Drawer
        onClose={() => setOpen(false)}
        open={open}
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
        width="100vw"
      >
        <div className="bg-primary relative text-white p-4 min-h-screen flex flex-col">
          <div>
            <div className="flex items-center justify-between px-2 pb-8">
              <Link 
                href={USER_APP_ROUTES.getPath('dashboard')}
                onClick={() => {
                  if (currentItemId === 'dashboard') {
                    setOpen(false);
                  }
                }}
              >
                <Logo className="w-20" />
              </Link>
              <div className="flex items-center gap-5">
                <Avatar src={user?.image} size={40} />
                <button onClick={() => setOpen(false)}>
                  <CloseOutlined className="text-white" />
                </button>
              </div>
            </div>
            {sidebarItems}
          </div>

          <div className="mt-16">
            {platformSwitchButtons}

            <button
              className="flex items-center w-full px-4 py-6 pl-6 rounded hover:bg-blue-800 text-red-300"
              onClick={signOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Log out
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
};
