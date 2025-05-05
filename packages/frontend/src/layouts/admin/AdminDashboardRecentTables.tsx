import React, {
  FunctionComponent,
  PropsWithChildren,
  useMemo,
  useState,
} from "react";
import {
  ArrowRightIcon,
  Building2Icon,
  CreditCardIcon,
  HelpCircleIcon,
  ShieldIcon,
} from "lucide-react";
import { Button, Card, Table, Tag } from "antd";
import { ColumnsType } from "antd/lib/table";
import { useRecentOrganizations } from "@/hooks/admin/useRecentOrganizations";
import { useRecentUsers } from "@/hooks/admin/useRecentUsers";
import { PlatformOrganizationsSchema, PlatformUserInfoSchema } from 'common';
import { formatDate } from "date-fns";
import Link from "next/link";
import { ADMIN_ROUTES } from "@/routing/routes";
import { UserInfoModal } from "@/components/admin/UserInfoModal";
import { OrganizationInfoModal } from "@/components/admin/OrganizationInfoModal";

type Props = object;

export const AdminDashboardRecentTables: FunctionComponent<
  PropsWithChildren<Props>
> = () => {
  const { data: organizations, isLoading: isLoadingOrganizations } =
    useRecentOrganizations({ limit: 5 });
  const { data: users, isLoading: isLoadingUsers } = useRecentUsers({
    limit: 5,
  });
  const [organizationInfo, setOrganizationInfo] =
    useState<PlatformOrganizationsSchema>();
  const [userInfo, setUserInfo] = useState<PlatformUserInfoSchema>();

  const organizationColumns: ColumnsType = useMemo(() => {
    return [
      {
        title: "Name",
        dataIndex: "name",
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <CreditCardIcon className="w-5 text-muted-foreground" />
            <span>Plan</span>
          </div>
        ),
        dataIndex: "plan",
        render: (_, row) => (
          <Tag color={row.plan.slug === "free" ? "default" : "blue"}>
            {row.plan.name}
          </Tag>
        ),
      },
      {
        title: "Users",
        dataIndex: "users",
        render: (_, row) => row.formattedStats.userUsage,
      },
      {
        title: "Created",
        dataIndex: "created_at",
        render: (_, row) => formatDate(row.created_at, "MMM dd, yyyy"),
      },
      {
        title: "Info",
        dataIndex: "actions",
        render: (_, row) => (
          <Button
            icon={<HelpCircleIcon className="h-4 w-4" />}
            size="large"
            variant="text"
            shape="circle"
            color="default"
            onClick={() => setOrganizationInfo(row as PlatformOrganizationsSchema)}
          />
        ),
      },
    ];
  }, []);

  const userColumns: ColumnsType = useMemo(() => {
    return [
      {
        title: "User",
        dataIndex: "email",
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <Building2Icon className="w-5 text-muted-foreground" />
            <span>Organization</span>
          </div>
        ),
        dataIndex: "organization",
        render: (_, row) => row.organization.name,
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <ShieldIcon className="w-5 text-muted-foreground" />
            <span>Role</span>
          </div>
        ),
        dataIndex: "role",
        render: (_, row) => (
          <Tag
            className="capitalize"
            color={row.role === "user" ? "default" : "blue"}
          >
            {row.role}
          </Tag>
        ),
      },
      {
        title: "Created",
        dataIndex: "created_at",
        render: (_, row) => formatDate(row.created_at, "MMM dd, yyyy"),
      },
      {
        title: "Info",
        dataIndex: "actions",
        render: (_, row) => (
          <Button
            icon={<HelpCircleIcon className="h-4 w-4" />}
            size="large"
            variant="text"
            shape="circle"
            color="default"
            onClick={() => setUserInfo(row as PlatformUserInfoSchema)}
          />
        ),
      },
    ];
  }, []);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card classNames={{ body: "!p-0" }} className="overflow-hidden">
        <div className="space-y-1 p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-medium text-xl mb-0">Recent Organizations</h3>
            <Link href={ADMIN_ROUTES.getPath("adminOrganizations")}>
              <ArrowRightIcon />
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            Latest 5 organisations added to the platform
          </div>
        </div>
        <Table
          columns={organizationColumns}
          className="[&>div>div>.ant-table]:min-h-[60vh] [&>div>div>.ant-table]:overflow-x-auto"
          rowKey="id"
          dataSource={organizations?.data}
          loading={isLoadingOrganizations}
          pagination={false}
        />
      </Card>
      <Card classNames={{ body: "!p-0" }} className="overflow-hidden">
        <div className="space-y-1 p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-medium text-xl mb-0">Recent Users</h3>
            <Link href={ADMIN_ROUTES.getPath("adminUsers")}>
              <ArrowRightIcon />
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            Latest 5 users across all organisations
          </div>
        </div>
        <Table
          columns={userColumns}
          className="[&>div>div>.ant-table]:min-h-[60vh] [&>div>div>.ant-table]:overflow-x-auto"
          rowKey="id"
          dataSource={users?.data}
          loading={isLoadingUsers}
          pagination={false}
        />
      </Card>

      <OrganizationInfoModal
        organization={organizationInfo}
        onCancel={() => setOrganizationInfo(undefined)}
      />

      <UserInfoModal user={userInfo} onCancel={() => setUserInfo(undefined)} />
    </div>
  );
};
