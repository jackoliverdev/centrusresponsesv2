import { useState, DragEvent, useCallback, useMemo, FunctionComponent } from 'react';
import { ChevronRight, ChevronDown, Folder, Trash2Icon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { FolderThreadPreview } from "./FolderThreadPreview";
import { ChatsSchema, FolderWithThreadsSchema } from "common";
import { Button, message, Popconfirm } from "antd";
import { isThreadInFolder } from "@/utils";
import { EditFolderMenu } from "@/components/app/Chat/EditFolderMenu";
import { useDeleteThreadFolder } from "@/hooks/chat/useDeleteThreadFolder";
import classNames from "classnames";
import { useAuthContext } from "@/context/AuthContext";

type Props = {
  folder: FolderWithThreadsSchema;
  chats: ChatsSchema;
  isActive: boolean;
  isUpdating: boolean;
  onSelect: (folderId?: number) => void;
  onChatSelect: (threadId: string) => void;
  onDrop: (
    threadId: string,
    folderId: number,
    moveFromFolderId?: number,
  ) => void;
};

export const ThreadFolderItem: FunctionComponent<Props> = ({
  folder,
  chats,
  isActive,
  onSelect,
  onChatSelect,
  onDrop,
  isUpdating,
}) => {
  const { isOrgAdmin, isPlatformAdmin, user } = useAuthContext();
  const { mutate: deleteFolder, isLoading: isDeleting } =
    useDeleteThreadFolder();
  const [isOver, setIsOver] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const userCanUpdate = useMemo(() => {
    const isMine = user?.id === folder.userId;
    return isMine || (folder.global && (isOrgAdmin || isPlatformAdmin));
  }, [folder, user, isOrgAdmin, isPlatformAdmin]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      const threadId = e.dataTransfer.getData("threadId");
      const moveFromFolderId = Number(
        e.dataTransfer.getData("moveFromFolderId"),
      );
      if (threadId && isThreadInFolder(threadId, folder)) {
        // drag within same folder
        return;
      }
      if (threadId) {
        if (moveFromFolderId) {
          // move from one folder to another
          onDrop(threadId, folder.id, moveFromFolderId);
          return;
        }
        onDrop(threadId, folder.id);
      }
    },
    [folder, onDrop],
  );

  const handleFolderDelete = useCallback(() => {
    deleteFolder(
      {
        id: folder.id,
      },
      {
        onSuccess: () => {
          onSelect(undefined);
          setConfirmDelete(false);
          return void message.success("Folder deleted successfully");
        },
        onError: () => void message.error("Failed to delete folder"),
      },
    );
  }, [deleteFolder, folder.id, onSelect]);

  return (
    <div
      className={twMerge(
        "group relative select-none",
        isActive && "bg-blue-50",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={twMerge(
          "relative flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-50/80",
          isOver && "bg-blue-50/50 border border-blue-200 rounded",
          isActive && "bg-blue-50",
        )}
        onClick={() => onSelect(folder.id)}
      >
        <Button
          variant="text"
          type="text"
          size="small"
          className={twMerge("h-6 w-6 p-0", !isCollapsed && "bg-transparent")}
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
          disabled={isUpdating}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          ) : (
            <ChevronDown className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          )}
        </Button>

        <div className="h-4 w-4 mx-1.5" style={{ color: folder.color }}>
          <Folder className="h-4 w-4" />
        </div>

        <span className="flex-1 truncate font-medium text-sm ml-0.5">
          {folder.name}
          <span className="ml-1 text-gray-400 text-xs">
            ({folder.threads.length})
          </span>
        </span>

        {userCanUpdate && (
          <Popconfirm
            title="Delete Folder"
            description={
              <>
                <p className="font-medium">
                  This will not delete your chats.
                </p>
                {folder.threads.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Folder contains {folder.threads.length} chat
                    {folder.threads.length !== 1 ? "s" : ""}.
                  </p>
                )}
              </>
            }
            open={confirmDelete}
            onConfirm={handleFolderDelete}
            okButtonProps={{ loading: isDeleting }}
            cancelButtonProps={{ disabled: isDeleting }}
            onCancel={() => setConfirmDelete(false)}
            onPopupClick={(e) => e.stopPropagation()}
          >
            <Button
              type="text"
              variant="text"
              shape="circle"
              color="danger"
              className={classNames(
                "opacity-0 !p-0 data-[state=open]:opacity-100 transition-opacity",
                confirmDelete ? "opacity-100 " : "group-hover:opacity-100",
              )}
              loading={isUpdating}
              icon={<Trash2Icon className="h-3 w-3" />}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
            />
          </Popconfirm>
        )}

        {userCanUpdate && <EditFolderMenu folder={folder} />}
      </div>

      {!isCollapsed && (
        <FolderThreadPreview
          chats={chats}
          folder={folder}
          className="ml-6"
          onChatSelect={onChatSelect}
        />
      )}
    </div>
  );
};
