import React, { FunctionComponent } from "react";
import { Progress } from "antd";
import { HardDrive, MessageCircle, Users } from "lucide-react";
import { formatBytes } from "@/utils";
import { PlatformOrganizationsSchema } from "common";

type Props = {
  organization: PlatformOrganizationsSchema;
};

export const OrganizationPlanUsage: FunctionComponent<Props> = ({
  organization,
}) => {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-lg">Current Usage</h3>
        <span className="text-blue-500 bg-blue-50 px-2.5 py-0.5 rounded-md text-sm font-medium">
          {organization.plan.name}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Monthly Messages</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {organization.formattedStats.messageUsage ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">
              of {organization.formattedStats.messageLimit} per month
            </span>
          </div>
          <Progress
            size="small"
            percent={organization.formattedStats.messagePercentage}
            showInfo={false}
            status={
              (organization.formattedStats.messagePercentage ?? 0) >= 90
                ? "exception"
                : "normal"
            }
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Storage</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formatBytes(organization.formattedStats.storageUsage ?? 0)}
            </span>
            <span className="text-sm text-muted-foreground">
              of {formatBytes(organization.formattedStats.storageLimit ?? 0)}
            </span>
          </div>
          <Progress
            size="small"
            percent={organization.formattedStats.storagePercentage}
            showInfo={false}
            status={
              (organization.formattedStats.storagePercentage ?? 0) >= 90
                ? "exception"
                : "normal"
            }
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Users</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {organization.formattedStats.userUsage ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">
              of {organization.formattedStats.userLimit} seats
            </span>
          </div>
          <Progress
            size="small"
            percent={organization.formattedStats.userPercentage}
            showInfo={false}
            status={
              (organization.formattedStats.userPercentage ?? 0) >= 90
                ? "exception"
                : "normal"
            }
          />
        </div>
      </div>
    </>
  );
};
