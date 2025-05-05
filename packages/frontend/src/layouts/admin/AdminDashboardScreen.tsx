import { FunctionComponent, PropsWithChildren, useMemo } from "react";
import { AdminLayout } from "@/layouts/admin/AdminLayout";
import {
  Building2Icon,
  HardDriveIcon,
  MessageCircle,
  UsersIcon,
} from "lucide-react";
import { Card } from "antd";
import { AdminDashboardRecentTables } from "@/layouts/admin/AdminDashboardRecentTables";
import { useAdminStats } from "@/hooks/admin/useAdminStats";
import { formatNumber, formatPercent } from "common";
import { formatBytes } from "@/utils";

type Props = object;

export const AdminDashboardScreen: FunctionComponent<
  PropsWithChildren<Props>
> = () => {
  const { data, isLoading } = useAdminStats();

  const stats = useMemo(() => {
    const organizations = formatNumber(data?.organizations, {
      useGrouping: true,
    });
    const users = formatNumber(data?.users, { useGrouping: true });
    const bytesUsed = data?.storage ?? 0;
    const messagesUsed = data?.messages ?? 0;
    const prevMessagesUsed = data?.previousMessages ?? 0;
    const messageDelta =
      (messagesUsed - prevMessagesUsed) / ((prevMessagesUsed || 1) * 100);

    return [
      {
        icon: <Building2Icon className="w-4 text-muted-foreground" />,
        name: "Total organizations",
        value: organizations,
        description: `${organizations} active`,
      },
      {
        icon: <MessageCircle className="w-4 text-muted-foreground" />,
        name: "Messages (7 Days)",
        value: formatNumber(messagesUsed, { useGrouping: true }),
        description: `${formatPercent(messageDelta)} from last week`,
      },
      {
        icon: <HardDriveIcon className="w-4 text-muted-foreground" />,
        name: "Storage Used",
        value: formatBytes(bytesUsed),
        description: `of ${formatBytes(100000000000000)} total`,
      },
      {
        icon: <UsersIcon className="w-4 text-muted-foreground" />,
        name: "Total Users",
        value: users,
        description: `${users} active`,
      },
    ];
  }, [data]);
  return (
    <AdminLayout currentItemId={"dashboard"}>
      <div className="px-3 md:px-6 @container gap-6 flex flex-col">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} loading={isLoading}>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-medium text-base">{stat.name}</span>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.description}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <AdminDashboardRecentTables />
      </div>
    </AdminLayout>
  );
};
