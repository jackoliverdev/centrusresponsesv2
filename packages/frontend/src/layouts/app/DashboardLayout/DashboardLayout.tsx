import { FunctionComponent, useEffect } from "react";
import { AppLayout } from "../AppLayout";
import {
  HardDriveIcon,
  MessageCircle,
  PieChartIcon,
  UsersIcon,
} from "lucide-react";
import { Stat } from "./Stat";
import { Card } from "./Card";
import { MessagesChart } from "./MessagesChart";
import { UsageChart } from "./UsageChart";
import { UsersLayout } from "../UsersLayout";
import { DashboardMobileSection } from "./DashboardMobileSection";
import { getUserLabel } from "@/utils/user";
import { useAuthContext } from "@/context/AuthContext";
import { usePlan } from "@/hooks/plan/usePlan";
import { useQueryClient } from "react-query";
import { formatBytes } from "@/utils";

export type DashboardLayoutProps = object;

export const DashboardLayout: FunctionComponent<DashboardLayoutProps> = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { data, isLoading } = usePlan();
  const {
    messageUsage,
    messageLimit,
    userUsage,
    userLimit,
    storageUsage,
    storageLimit,
    name,
  } = data || {};

  useEffect(() => {
    queryClient.invalidateQueries(["active-plan"]).catch();
  }, [queryClient]);

  return (
    <AppLayout
      currentItemId={"dashboard"}
      subtitle={user ? `Welcome back, ${getUserLabel(user)}` : "Welcome"}
      loading={isLoading}
    >
      <div className="px-3 sm:px-6 @container gap-y-3 sm:gap-y-5 flex flex-col">
        <div className="grid grid-cols-2 @5xl:grid-cols-4 gap-3">
          <Stat
            label="Monthly Messages Used"
            value={`${messageUsage ?? 0} of ${messageLimit ?? 0}`}
            icon={MessageCircle}
            loading={isLoading}
          />
          <Stat
            label="Storage Used"
            value={`${formatBytes(storageUsage ?? 0)} of ${formatBytes(storageLimit ?? 0)}`}
            icon={HardDriveIcon}
            loading={isLoading}
          />
          <Stat
            label="Active Users"
            value={`${userUsage ?? 0} of ${userLimit ?? 1}`}
            icon={UsersIcon}
            loading={isLoading}
          />
          <Stat
            label="Plan Type"
            value={name}
            icon={PieChartIcon}
            loading={isLoading}
          />
        </div>

        <DashboardMobileSection />

        <div className="hidden md:grid grid-cols-1 @5xl:grid-cols-4 gap-3">
          <Card className="@5xl:col-span-3 p-6 flex items-stretch flex-col h-96">
            <MessagesChart />
          </Card>
          <Card className="p-6 flex items-stretch flex-col h-96">
            <div className="text-xl font-bold mb-4">Data overview</div>
            <UsageChart />
          </Card>
        </div>

        <div className="hidden md:block">
          <UsersLayout />
        </div>
      </div>
    </AppLayout>
  );
};
