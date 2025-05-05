import { Building2, LayoutDashboard, Users, Bot } from "lucide-react";
import { ADMIN_ROUTES } from "@/routing/routes";
import { NavigationItem } from "@/routing/navigation/types";

export const ADMIN_NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    name: "Dashboard",
    title: "Platform Overview",
    Icon: LayoutDashboard,
    path: ADMIN_ROUTES.getPath("adminDashboard"),
    adminOnly: true,
  },
  {
    id: "organizations",
    name: "Organizations",
    Icon: Building2,
    path: ADMIN_ROUTES.getPath("adminOrganizations"),
  },
  {
    id: "users",
    name: "Users",
    title: "Platform Users",
    Icon: Users,
    path: ADMIN_ROUTES.getPath("adminUsers"),
    adminOnly: true,
  },
  {
    id: "agents",
    name: "Agents",
    title: "Platform Agents",
    Icon: Bot,
    path: ADMIN_ROUTES.getPath("adminAgents"),
    adminOnly: true,
  },
] as const satisfies NavigationItem[];

export type NavigationItemId = (typeof ADMIN_NAVIGATION_ITEMS)[number]["id"];
