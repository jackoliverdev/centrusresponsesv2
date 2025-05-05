import React, { FunctionComponent, PropsWithChildren } from 'react';
import { Card, Progress } from "antd";
import { HardDrive, MessageCircle, Users } from "lucide-react";
import { usePlan } from "@/hooks/plan/usePlan";
import { formatBytes } from '@/utils';

type Props = object;

export const PlanUsage: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
}) => {
  const { data: planData, isLoading } = usePlan();
  if (!planData) return <Card loading={isLoading} className="min-h-[12.875rem]" />;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-lg">Current Plan</h3>
        <span className="text-blue-500 bg-blue-50 px-2.5 py-0.5 rounded-md text-sm font-medium">
          {planData.name}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Monthly Messages</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{planData.messageUsage ?? 0}</span>
            <span className="text-sm text-muted-foreground">
              of {planData.messageLimit} per month
            </span>
          </div>
          <Progress
            size="small"
            percent={isLoading ? 0 : planData.messagePercentage}
            showInfo={false}
            status={(planData.messagePercentage ?? 0) >= 90 ? "exception" : "normal"}
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Storage</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{formatBytes(planData.storageUsage ?? 0)}</span>
            <span className="text-sm text-muted-foreground">
              of {formatBytes(planData.storageLimit ?? 0)} available
            </span>
          </div>
          <Progress
            size="small"
            percent={isLoading ? 0 : planData.storagePercentage}
            showInfo={false}
            status={(planData.storagePercentage ?? 0) >= 90 ? "exception" : "normal"}
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Users</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{planData.userUsage ?? 0}</span>
            <span className="text-sm text-muted-foreground">
              of {planData.userLimit} seats
            </span>
          </div>
          <Progress
            size="small"
            percent={isLoading ? 0 : planData.userPercentage}
            showInfo={false}
            status={(planData.userPercentage ?? 0) >= 90 ? "exception" : "normal"}
          />
        </div>
      </div>

      {children}
    </Card>
  );
};
