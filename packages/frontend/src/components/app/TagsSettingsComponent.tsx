import React, {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Button, Modal, Table, Tooltip } from "antd";
import { formatNumber, TagSchema } from "common";
import { CloseOutlined } from "@ant-design/icons";
import {
  FileIcon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
  SparklesIcon,
} from "lucide-react";
import { useTagsInfo } from "@/hooks/tags/useTagsInfo";
import { usePaginate } from "@/hooks/usePaginate";
import { useDeleteTag } from "@/hooks/tags/useDeleteTag";
import { ColumnsType } from "antd/lib/table";
import { CreateEditTagModal } from "@/components/app/CreateEditTagModal";
import { SuggestedTagContextModal } from "@/components/app/SuggestedTagContextModal";
import { useOrganization } from "@/hooks/admin/useOrganization";
import {
  DataAccessTag,
  DataAccessTagProps,
} from "@/components/app/DataAccessTag";

type Props = object;

export const TagsSettingsComponent: FunctionComponent<
  PropsWithChildren<Props>
> = () => {
  const { page, limit, filterBy, orderBy, onTableChange } = usePaginate({
    defaultOrder: {
      orderBy: "created_at",
      order: "desc",
    },
  });

  const {
    data: tags,
    isFetching,
    refetch,
  } = useTagsInfo({
    limit,
    page,
    filters: filterBy,
    ...orderBy,
  });
  const [editTagItem, setEditTagItem] = useState<TagSchema>();
  const [deleteTagItem, setDeleteTagItem] = useState<TagSchema>();
  const [showCreateTagForm, setShowCreateTagForm] = useState(false);
  const [showSuggestedTagContext, setShowSuggestedTagContext] = useState(false);
  const { data: organization } = useOrganization();

  const { mutate: deleteTag, isLoading: isLoadingDeleteTag } = useDeleteTag();

  const onDeleteTag = useCallback(async () => {
    if (!deleteTagItem?.id) {
      return;
    }

    deleteTag(
      { id: deleteTagItem.id },
      {
        onSuccess() {
          setDeleteTagItem(undefined);
          refetch();
        },
      },
    );
  }, [deleteTag, deleteTagItem, refetch]);

  const columns: ColumnsType = useMemo(() => {
    return [
      {
        title: "Tag",
        dataIndex: "name",
        render: (_, row) => (
          <DataAccessTag tag={row as DataAccessTagProps["tag"]} />
        ),
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <UsersIcon className="w-5 text-muted-foreground" />
            <span>Users</span>
          </div>
        ),
        dataIndex: "users",
        render: (_, row) =>
          formatNumber(row.users?.length ?? 0, { useGrouping: true }),
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <FileIcon className="w-5 text-muted-foreground" />
            <span>Documents</span>
          </div>
        ),
        dataIndex: "documents",
        render: (_, row) =>
          formatNumber(row.documents?.length ?? 0, { useGrouping: true }),
      },
      {
        title: (
          <div className="flex gap-1 items-center">
            <MessageCircleIcon className="w-5 text-muted-foreground" />
            <span>Threads</span>
          </div>
        ),
        dataIndex: "threads",
        render: (_, row) =>
          formatNumber(row.threads?.length ?? 0, { useGrouping: true }),
      },
      {
        title: "Actions",
        dataIndex: "actions",
        render: (_, row) => (
          <div className="flex gap-2 items-center">
            <Tooltip title="Tag Settings">
              <Button
                icon={<PencilIcon className="h-3 w-3" />}
                size="small"
                variant="outlined"
                color="default"
                onClick={() => setEditTagItem(row as TagSchema)}
              />
            </Tooltip>
            <Tooltip title="Delete Tag">
              <Button
                icon={<Trash2Icon className="h-3 w-3" />}
                size="small"
                variant="outlined"
                color="danger"
                loading={isLoadingDeleteTag && deleteTagItem?.id === row.id}
                onClick={() => setDeleteTagItem(row as TagSchema)}
              />
            </Tooltip>
          </div>
        ),
      },
    ];
  }, [deleteTagItem?.id, isLoadingDeleteTag]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold">Tag Management</h2>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              className="flex items-center gap-2"
              icon={<SparklesIcon className="h-4 w-4" />}
              onClick={() => setShowSuggestedTagContext(true)}
            >
              Suggested Tag Context
            </Button>
            <Button
              variant="solid"
              color="primary"
              className="flex items-center gap-2"
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setShowCreateTagForm(true)}
            >
              Create New Tag
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          className="[&>div>div>.ant-table]:min-h-[60vh] [&>div>div>.ant-table]:overflow-x-auto"
          rowKey="id"
          dataSource={tags?.data}
          loading={{
            spinning: isFetching,
            delay: 0,
          }}
          pagination={{
            total: tags?.total,
            pageSize: tags?.limit,
            showSizeChanger: true,
            showTotal: (count) =>
              `${formatNumber(count, { useGrouping: true })} Results`,
          }}
          onChange={onTableChange}
        />
      </div>

      <CreateEditTagModal
        tag={editTagItem}
        open={showCreateTagForm || !!editTagItem}
        onClose={(success?: boolean) => {
          if (success) {
            void refetch();
          }
          setShowCreateTagForm(false);
          setEditTagItem(undefined);
        }}
      />

      <SuggestedTagContextModal
        open={showSuggestedTagContext}
        onClose={() => setShowSuggestedTagContext(false)}
        initialValue={organization?.suggested_tag_context}
      />

      <Modal
        open={!!deleteTagItem}
        centered
        width={450}
        footer={
          <div className="flex justify-end gap-4">
            <Button
              disabled={isLoadingDeleteTag}
              onClick={() => setDeleteTagItem(undefined)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="danger"
              loading={isLoadingDeleteTag}
              onClick={onDeleteTag}
            >
              Delete
            </Button>
          </div>
        }
        title={<h2 className="text-xl font-bold">Delete Tag</h2>}
        closeIcon={<CloseOutlined className="text-grey-dark" />}
        className="rounded-xl shadow-card-shadow"
        closable={!isLoadingDeleteTag}
        maskClosable={!isLoadingDeleteTag}
        keyboard={!isLoadingDeleteTag}
        onCancel={() => setDeleteTagItem(undefined)}
      >
        {deleteTagItem && (
          <div className="w-full pt-3 pb-6">
            <div className="w-full flex flex-col gap-y-4">
              <p className="text-sm text-grey-medium">
                This will remove this tag from any documents it&#39;s applied to
                and any members it&#39;s assigned to. The documents and users
                will not be deleted.
                <br />
                Do you want to proceed?
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
