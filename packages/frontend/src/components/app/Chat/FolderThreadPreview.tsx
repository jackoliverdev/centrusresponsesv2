import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
import { Avatar } from "@/components/ui/avatar";
import { getUserLabel } from "@/utils/user";
import { ChatsSchema, FolderWithThreadsSchema } from "common";
import { DragEvent, FunctionComponent, useCallback, useMemo, useState } from 'react';
import { MinusIcon } from "lucide-react";
import { Tooltip, Button, message } from "antd";
import { useDetachThreadFromFolder } from "@/hooks/chat/useDetachThreadFromFolder";
import { DataAccessTag } from "@/components/app/DataAccessTag";

type Props = {
  folder: FolderWithThreadsSchema;
  chats: ChatsSchema;
  className?: string;
  onChatSelect: (chatId: string) => void;
  onDrop?: (threadId: string, folderId: number) => void;
};

export const FolderThreadPreview: FunctionComponent<Props> = ({
  folder,
  chats,
  onChatSelect,
  className,
}) => {
  const { mutate: detachFolder, isLoading: isDetachingFolder } =
    useDetachThreadFromFolder();
  const [detachingThreadId, setDetachingThreadId] = useState<string>();

  const handleDetach = useCallback(
    (threadId: string) => {
      setDetachingThreadId(threadId);
      detachFolder(
        { folderId: folder.id, threadId },
        {
          onSuccess: () => {
            return void message.success(
              "Thread successfully removed from folder.",
            );
          },
          onError: () =>
            void message.error(
              "Failed to remove thread from folder. Please try again",
            ),
          onSettled: () => setDetachingThreadId(threadId),
        },
      );
    },
    [detachFolder, folder],
  );

  // Get chats that belong to this folder
  const threads = useMemo(
    () =>
      chats
        .filter((chat) => folder.threads.map(({ id }) => id).includes(chat.id))
        .sort(
          (a, b) =>
            new Date(b.modified_at).getTime() -
            new Date(a.modified_at).getTime(),
        ),
    [chats, folder.threads],
  );

  const handleDragStart = useCallback(
    (e: DragEvent, threadId: string) => {
      e.dataTransfer.setData("threadId", threadId);
      e.dataTransfer.setData("moveFromFolderId", folder.id.toString());
    },
    [folder.id],
  );

  if (!threads.length) {
    return (
      <div
        className={twMerge("py-2 px-3 text-sm text-gray-500 italic", className)}
      >
        No chats in folder
      </div>
    );
  }

  return (
    <div className={twMerge("border-t border-gray-100", className)}>
      {threads.map((thread) => (
        <div
          key={thread.id}
          data-thread-id={thread.id}
          className="py-1.5 px-3 hover:bg-gray-50 cursor-pointer flex gap-2"
          draggable
          onDragStart={(e) => handleDragStart(e, thread.id)}
          onClick={() => onChatSelect(thread.id)}
        >
          <Avatar
            src={thread.user?.image}
            className="h-5 w-5 shrink-0 mt-0.5"
          />

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-700 truncate">
                {thread.name || "Untitled Chat"}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400">
                  {getUserLabel(thread.user)}
                </span>
                <DataAccessTag className="text-[11px]" tag={thread.tag} />
                <Tooltip title="Remove from folder">
                  <Button
                    variant="text"
                    color="danger"
                    size="small"
                    className={twMerge(
                      "h-5 w-5 lg:h-6 lg:w-6",
                      "transition-opacity",
                    )}
                    loading={
                      detachingThreadId === thread.id && isDetachingFolder
                    }
                    icon={<MinusIcon className="h-3 w-3 lg:h-3.5 lg:w-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDetach(thread.id);
                    }}
                  />
                </Tooltip>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-400 truncate">
                {thread.last_message || "No messages"}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {format(new Date(thread.modified_at), "MMM d")}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
