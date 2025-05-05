"use client";

import React, { FunctionComponent, useMemo } from "react";
import { Modal, Button, Tag, Progress } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { Building2Icon, CalendarIcon, ShieldIcon } from "lucide-react";
import { formatDate } from "date-fns";
import { PlatformOrganizationsSchema } from "common";
import { formatBytes } from "@/utils";

type Props = {
  organization?: PlatformOrganizationsSchema;
  onCancel(): void;
};

export const OrganizationInfoModal: FunctionComponent<Props> = ({
  organization,
  onCancel,
}) => {
  const stat = useMemo(
    () => organization?.formattedStats,
    [organization?.formattedStats],
  );

  return (
    <Modal
      open={!!organization}
      centered
      width={450}
      footer={
        <div className="flex justify-end gap-4">
          <Button onClick={onCancel}>Close</Button>
        </div>
      }
      title={<h2 className="text-xl font-bold">Organisation Details</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      onCancel={onCancel}
    >
      {organization && stat && (
        <div className="gap-y-4">
          <div className="flex items-start gap-x-4 mt-6">
            <div className="rounded-full bg-blue-100 p-2 hidden sm:block">
              <Building2Icon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="gap-y-4 flex-1">
              <div>
                <h3 className="text-lg font-semibold">{organization.name}</h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldIcon className="h-4 w-4" />
                      Plan Type
                    </span>
                    <div className="mt-1">
                      <Tag color="blue">{organization.plan.name}</Tag>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldIcon className="h-4 w-4" />
                      Status
                    </span>
                    <div className="mt-1">
                      <Tag color="blue">Active</Tag>
                    </div>
                  </div>
                  <hr className="col-span-2" />
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Created
                    </span>
                    <div className="mt-1 text-sm">
                      {formatDate(organization.created_at, "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              <div>
                <h4 className="text-md font-semibold">Resource Usage</h4>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="col-span-2">
                    <div className="flex flex-col gap-3 text-xs">
                      <div className="flex flex-col">
                        <div className="flex gap-2 justify-between">
                          <span>Storage</span>
                          <span>
                            {formatBytes(stat.storageUsage)} /{" "}
                            {formatBytes(stat.storageLimit)}
                          </span>
                        </div>
                        <Progress
                          size="small"
                          percent={stat.storagePercentage}
                          showInfo={false}
                          status={
                            stat.storagePercentage >= 90
                              ? "exception"
                              : "normal"
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex gap-2 justify-between">
                          <span>Monthly Messages</span>
                          <span>
                            {stat.messageUsage} / {stat.messageLimit}
                          </span>
                        </div>
                        <Progress
                          size="small"
                          percent={stat.messagePercentage}
                          showInfo={false}
                          status={
                            stat.messagePercentage >= 90
                              ? "exception"
                              : "normal"
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex gap-2 justify-between">
                          <span>Users</span>
                          <span>
                            {stat.userUsage} / {stat.userLimit}
                          </span>
                        </div>
                        <Progress
                          size="small"
                          percent={stat.userPercentage}
                          showInfo={false}
                          status={
                            stat.userPercentage >= 90 ? "exception" : "normal"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
