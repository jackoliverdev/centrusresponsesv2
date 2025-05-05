"use client";

import { FunctionComponent } from "react";
import { Modal, Button, Tag } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { Building2Icon, CalendarIcon, MailIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { formatDate } from "date-fns";
import { getUserLabel } from "@/utils/user";
import { PlatformUserInfoSchema } from "common";

type Props = {
  user?: PlatformUserInfoSchema;
  onCancel(): void;
};

export const UserInfoModal: FunctionComponent<Props> = ({ user, onCancel }) => {
  return (
    <Modal
      open={!!user}
      centered
      width={450}
      footer={
        <div className="flex justify-end gap-4">
          <Button onClick={onCancel}>Close</Button>
        </div>
      }
      title={<h2 className="text-xl font-bold">User Details</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      onCancel={onCancel}
    >
      {user && (
        <div className="gap-y-4">
          <div className="flex items-start gap-x-4 mt-6">
            <div className="rounded-full bg-blue-100 p-2 hidden sm:block">
              <UserIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="gap-y-4 flex-1">
              <div>
                <h3 className="text-lg font-semibold">{getUserLabel(user)}</h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <MailIcon className="h-4 w-4" />
                      Email
                    </span>
                    <div className="mt-1 text-sm">{user.email}</div>
                  </div>
                  <hr className="col-span-2" />
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Joined
                    </span>
                    <div className="mt-1 text-sm">
                      {formatDate(user.created_at, "MMM d, yyyy")}
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
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2Icon className="h-4 w-4" />
                      Organization
                    </span>
                    <div className="mt-1 text-sm">
                      {user.organization.name}
                    </div>
                  </div>
                  <hr className="col-span-2" />
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Created
                    </span>
                    <div className="mt-1 text-sm">
                      {formatDate(user.created_at, "MMM d, yyyy")}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <ShieldIcon className="h-4 w-4" />
                      Role
                    </span>
                    <div className="mt-1">
                      <Tag className="capitalize" color="blue">{user.role}</Tag>
                    </div>
                  </div>
                  <hr className="col-span-2" />
                  <div>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Last Login
                    </span>
                    <div className="mt-1 text-sm">
                      {user.lastLogin
                        ? formatDate(user.lastLogin, "MMM d, yyyy HH:mm")
                        : "-"}
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
