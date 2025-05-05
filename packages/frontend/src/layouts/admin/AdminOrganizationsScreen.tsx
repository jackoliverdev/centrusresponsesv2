import React, { FunctionComponent, useMemo, useState } from "react";
import { AdminLayout } from "@/layouts/admin/AdminLayout";
import { ColumnsType } from "antd/lib/table";
import {
  CreditCardIcon,
  FileTextIcon,
  Settings2,
  UsersIcon,
} from "lucide-react";
import { Button, Card, Progress, Table, Tag } from "antd";
import { formatNumber, PlanSlug, PlatformOrganizationsSchema } from "common";
import { formatDate } from "date-fns";
import { useOrganizations } from "@/hooks/admin/useOrganizations";
import { CheckCircleOutlined } from "@ant-design/icons";
import { usePaginate } from "@/hooks/usePaginate";
import { formatBytes } from "@/utils";
import { SearchFilter } from "@/components/ui/search-filter";
import { useSearch } from "@/hooks/useSearch";
import { usePlans } from "@/hooks/plan/usePlans";
import { ChangeOrganizationLimitsModal } from "@/components/admin/ChangeOrganizationLimitsModal";

type Props = object;

export const AdminOrganizationsScreen: FunctionComponent<Props> = () => {
  const { data: plans } = usePlans();
  const [organization, setOrganization] =
    useState<PlatformOrganizationsSchema>();
  const { page, limit, filterBy, orderBy, onTableChange } = usePaginate({
    defaultOrder: {
      orderBy: "created_at",
      order: "desc",
    },
  });

  const { query, setQueryQuery, queryFilters } = useSearch({
    searchFilters: [
      { key: "id", operator: "eq", isNumeric: true },
      { key: "name", operator: "ilike" },
    ],
  });

  const {
    data: organizations,
    isFetching,
    refetch,
  } = useOrganizations({
    limit,
    page,
    searchFilters: queryFilters,
    filters: filterBy,
    ...orderBy,
  });

  const planFilterSlugs: PlanSlug[] = useMemo(
    () => [
      "enterprise",
      "large_team_annually",
      "large_team_monthly",
      "small_team_annually",
      "small_team_monthly",
      "free",
    ],
    [],
  );

  const organizationColumns: ColumnsType = useMemo(() => {
    return [
      {
        title: "# ID",
        dataIndex: "id",
        sorter: true,
      },
      {
        title: "Organization",
        dataIndex: "name",
        sorter: true,
      },
      {
        title: "Status",
        dataIndex: "status",
        render: () => (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Active
          </Tag>
        ),
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <CreditCardIcon className="w-5 text-muted-foreground" />
            <span>Plan</span>
          </div>
        ),
        dataIndex: "plan_id",
        render: (_, row) => (
          <>
            <Tag color={row.plan.slug === "free" ? "default" : "blue"}>
              {row.plan.name}
            </Tag>
            {row.plan.slug !== "free" && <Tag>{row.plan.duration}</Tag>}
          </>
        ),
        filters: plans
          ?.filter(({ slug }) => planFilterSlugs.includes(slug))
          .sort(
            (a, b) =>
              planFilterSlugs.indexOf(a.slug) - planFilterSlugs.indexOf(b.slug),
          )
          ?.map(({ name: text, id: value, duration, slug }) => ({
            text: slug === "free" ? text : `${text} (${duration})`,
            value,
          })),
        filterMultiple: false,
        sorter: true,
      },
      {
        title: "Usage",
        dataIndex: "usage",
        className: "!py-1",
        render: (_, row) => {
          const { formattedStats: stat } = row;
          return (
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
                  status={stat.storagePercentage >= 90 ? "exception" : "normal"}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex gap-2 justify-between">
                  <span>Messages</span>
                  <span>
                    {stat.messageUsage} / {stat.messageLimit}
                  </span>
                </div>
                <Progress
                  size="small"
                  percent={stat.messagePercentage}
                  showInfo={false}
                  status={stat.messagePercentage >= 90 ? "exception" : "normal"}
                />
              </div>
            </div>
          );
        },
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <UsersIcon className="w-5 text-muted-foreground" />
            <span>Users</span>
          </div>
        ),
        dataIndex: "users",
        render: (_, row) => {
          const { formattedStats: stat } = row;
          return (
            <div className="flex flex-col">
              <span>
                {stat.userUsage} / {stat.userLimit}
              </span>
              <Progress
                size="small"
                percent={stat.userPercentage}
                showInfo={false}
                status={stat.userPercentage >= 90 ? "exception" : "normal"}
              />
            </div>
          );
        },
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <FileTextIcon className="w-5 text-muted-foreground" />
            <span>Documents</span>
          </div>
        ),
        dataIndex: "documentCount",
        render: (_, row) =>
          formatNumber(row.documentCount, { useGrouping: true }),
      },
      {
        title: "Created",
        dataIndex: "created_at",
        sorter: true,
        defaultSortOrder: "descend" as const,
        render: (_, row) => formatDate(row.created_at, "MMM dd, yyyy"),
      },
      {
        title: "Actions",
        dataIndex: "actions",
        render: (_, row) => (
          <Button
            icon={<Settings2 className="h-4 w-4" />}
            size="large"
            variant="text"
            shape="circle"
            color="default"
            onClick={() => setOrganization(row as PlatformOrganizationsSchema)}
          />
        ),
      },
    ];
  }, [plans, planFilterSlugs]);

  return (
    <AdminLayout currentItemId={"organizations"}>
      <div className="px-6 @container gap-5 flex flex-col">
        <Card classNames={{ body: "!p-3" }}>
          <SearchFilter
            searchText={query}
            placeholder="Search organisations by name or ID"
            onSetSearchText={setQueryQuery}
            onSearch={refetch}
            loading={isFetching}
          />
        </Card>

        <Table
          columns={organizationColumns}
          className="[&>div>div>.ant-table]:min-h-[60vh] [&>div>div>.ant-table]:overflow-x-auto"
          rowKey="id"
          dataSource={organizations?.data}
          loading={{
            spinning: isFetching,
            delay: 0,
          }}
          pagination={{
            total: organizations?.total,
            pageSize: organizations?.limit,
            showSizeChanger: true,
            showTotal: (count) =>
              `${formatNumber(count, { useGrouping: true })} Results`,
          }}
          onChange={onTableChange}
        />

        <ChangeOrganizationLimitsModal
          organization={organization}
          onCancel={(success?: boolean) => {
            if (success) {
              void refetch();
            }
            setOrganization(undefined);
          }}
        />
      </div>
    </AdminLayout>
  );
};
