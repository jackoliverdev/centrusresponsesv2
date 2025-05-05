import React, { FunctionComponent, useMemo, useState } from "react";
import { AdminLayout } from "@/layouts/admin/AdminLayout";
import { Button, Card, Table, Tag, Tooltip } from 'antd';
import { usePaginate } from "@/hooks/usePaginate";
import { useUsers } from "@/hooks/admin/useUsers";
import { ColumnsType } from "antd/lib/table";
import { Building2Icon, KeyRoundIcon, ShieldIcon } from 'lucide-react';
import { formatDate } from "date-fns";
import { formatNumber } from "common";
import { SearchFilter } from "@/components/ui/search-filter";
import { useSearch } from "@/hooks/useSearch";
import { SendPasswordResetModal } from "@/components/admin/SendPasswordResetModal";

type Props = object;

export const AdminUsersScreen: FunctionComponent<Props> = () => {
  const [resetUserEmail, setResetUserEmail] = useState("");
  const { page, limit, filterBy, orderBy, onTableChange } = usePaginate({
    defaultOrder: {
      orderBy: "created_at",
      order: "desc",
    },
  });

  const { query, setQueryQuery, queryFilters } = useSearch({
    searchFilters: [
      { key: "id", operator: "eq", isNumeric: true },
      { key: "email", operator: "ilike" },
    ],
  });

  const {
    data: users,
    isFetching,
    refetch,
  } = useUsers({
    limit,
    page,
    searchFilters: queryFilters,
    filters: filterBy,
    ...orderBy,
  });

  const userColumns: ColumnsType = useMemo(() => {
    return [
      {
        title: "# ID",
        dataIndex: "id",
        sorter: true,
      },
      {
        title: "User",
        dataIndex: "email",
        sorter: true,
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
        sorter: true,
        defaultSortOrder: "descend" as const,
        render: (_, row) => formatDate(row.created_at, "MMM dd, yyyy"),
      },
      {
        title: "Actions",
        dataIndex: "actions",
        render: (_, row) => (
          <Tooltip title="Send password reset email">
            <Button
              icon={<KeyRoundIcon className="h-4 w-4" />}
              size="large"
              variant="text"
              shape="circle"
              color="default"
              onClick={() => setResetUserEmail(row.email)}
            />
          </Tooltip>
        ),
      },
    ];
  }, []);

  return (
    <AdminLayout currentItemId={"users"}>
      <div className="px-6 @container gap-5 flex flex-col">
        <Card classNames={{ body: "!p-3" }}>
          <SearchFilter
            searchText={query}
            placeholder="Search users by email or ID"
            onSetSearchText={setQueryQuery}
            onSearch={refetch}
            loading={isFetching}
          />
        </Card>

        <Table
          columns={userColumns}
          className="[&>div>div>.ant-table]:min-h-[60vh] [&>div>div>.ant-table]:overflow-x-auto"
          rowKey="id"
          dataSource={users?.data}
          loading={{
            spinning: isFetching,
            delay: 0,
          }}
          pagination={{
            total: users?.total,
            pageSize: users?.limit,
            showSizeChanger: true,
            showTotal: (count) =>
              `${formatNumber(count, { useGrouping: true })} Results`,
          }}
          onChange={onTableChange}
        />

        <SendPasswordResetModal
          email={resetUserEmail}
          onCancel={() => setResetUserEmail("")}
        />
      </div>
    </AdminLayout>
  );
};
