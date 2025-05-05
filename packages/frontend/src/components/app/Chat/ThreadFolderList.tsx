import { useState, useCallback, FunctionComponent } from "react";
import { ChevronRight, ChevronDown, Plus, Folder } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { message, Skeleton, Tooltip, Button } from "antd";
import { CreateThreadFolderModal } from "@/components/app/Chat/CreateThreadFolderModal";
import { ThreadFolderItem } from "@/components/app/Chat/ThreadFolderItem";
import { useAttachThreadToFolder } from "@/hooks/chat/useAttachThreadToFolder";
import { isThreadInFolder } from "@/utils";
import { useDetachThreadFromFolder } from "@/hooks/chat/useDetachThreadFromFolder";
import { ChatsSchema, FolderWithThreadsSchema } from "common";

type Props = {
  folders: FolderWithThreadsSchema[];
  chats: ChatsSchema;
  selectedFolderId?: number;
  isLoading: boolean;
  isError: boolean;
  onFolderSelect: (folderId?: number) => void;
  onChatSelect: (threadId: string) => void;
  className?: string;
};

export const ThreadFolderList: FunctionComponent<Props> = ({
  folders,
  chats,
  isLoading,
  isError,
  selectedFolderId,
  onFolderSelect,
  onChatSelect,
  className,
}) => {
  const { mutate: attachFolder, isLoading: isAttachingFolder } =
    useAttachThreadToFolder();
  const { mutate: detachFolder, isLoading: isDetachingFolder } =
    useDetachThreadFromFolder();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(true);
  const [attachingFolderId, setAttachingFolderId] = useState<number>();
  const [detachingFolderId, setDetachingFolderId] = useState<number>();

  const handleDrop = useCallback(
    (threadId: string, folderId: number, moveFromFolderId?: number) => {
      const folder = folders.find((f) => f.id === folderId);

      if (isThreadInFolder(threadId, folder)) {
        return;
      }

      setAttachingFolderId(folderId);

      attachFolder(
        { threadId, folderId },
        {
          onSuccess: () => {
            return void message.success("Thread successfully added to folder.");
          },
          onError: () =>
            void message.error(
              "Failed to add thread to folder. Please try again",
            ),
          onSettled: () => {
            setAttachingFolderId(undefined);
          },
        },
      );

      // move from one folder to another
      if (moveFromFolderId) {
        setDetachingFolderId(moveFromFolderId);
        detachFolder(
          { folderId: moveFromFolderId, threadId },
          {
            onSettled: () => {
              setDetachingFolderId(undefined);
            },
          },
        );
      }
    },
    [attachFolder, detachFolder, folders],
  );

  if (isLoading) {
    return (
      <div className="flex">
        <Skeleton.Node
          className="flex-1 h-11 sm:h-[4.625rem]"
          style={{ width: "100%" }}
          active
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={twMerge("p-4", className)}>
        <div className="text-sm text-gray-500 text-center p-4">
          Failed to load folders
        </div>
      </div>
    );
  }

  return (
    <div className={twMerge("py-0.5 lg:py-2", className)}>
      <div className="h-px bg-gray-200/75 mb-0.5 lg:mb-2" />

      <div className="space-y-0.5 lg:space-y-1">
        <div
          className={twMerge(
            "flex items-center px-2 py-1 lg:py-1.5 rounded-md transition-colors",
            !isSectionCollapsed && "bg-gray-50/50",
            "hover:bg-gray-50 group",
          )}
          onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
        >
          <Button
            variant="text"
            type="text"
            size="small"
            className={twMerge(
              "h-6 w-6 p-0 mr-1 lg:mr-1.5",
              !isSectionCollapsed && "bg-transparent",
            )}
          >
            {isSectionCollapsed ? (
              <ChevronRight className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
            ) : (
              <ChevronDown className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
            )}
          </Button>

          <div className="flex items-center gap-1 lg:gap-2 flex-1">
            <Folder className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-400" />
            <span className="text-xs lg:text-sm font-bold text-gray-600">
              Folders
              {folders.length > 0 && (
                <span className="ml-1 lg:ml-1.5 text-[10px] lg:text-xs text-gray-400">
                  ({folders.length})
                </span>
              )}
            </span>
          </div>

          <Tooltip title="Create folder">
            <Button
              variant="text"
              type="text"
              size="small"
              className={twMerge("h-6 w-6 p-0 transition-opacity")}
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(true);
              }}
            >
              <Plus className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
            </Button>
          </Tooltip>
        </div>

        <div
          className={twMerge(
            "space-y-0.5 transition-all duration-200 overflow-hidden",
            isSectionCollapsed ? "h-0" : "h-auto",
          )}
        >
          {!folders.length ? (
            <div className="text-xs lg:text-sm text-gray-500 text-center py-2 lg:p-4">
              No folders yet
            </div>
          ) : (
            folders.map((folder) => (
              <ThreadFolderItem
                key={folder.id}
                chats={chats}
                folder={folder}
                isActive={folder.id === selectedFolderId}
                isUpdating={
                  (folder.id === attachingFolderId && isAttachingFolder) ||
                  (folder.id === detachingFolderId && isDetachingFolder)
                }
                onSelect={onFolderSelect}
                onChatSelect={onChatSelect}
                onDrop={handleDrop}
              />
            ))
          )}
        </div>
      </div>

      <div className="h-px bg-gray-200/75 mt-0.5 lg:mt-2" />

      <CreateThreadFolderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
