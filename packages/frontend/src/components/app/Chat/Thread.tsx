import { Avatar } from "@/components/ui/avatar";
import { getUserLabel } from "@/utils/user";
import { DataAccessTag } from "@/components/app/DataAccessTag";
import { format } from "date-fns";
import { Button, message, Checkbox } from "antd";
import { ArchiveIcon, ChevronDownIcon, ChevronUpIcon, Pin } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { FunctionComponent, useCallback, DragEvent, useState } from "react";
import { ThreadSchema } from "common";
import { useUpdateChat } from "@/hooks/chat/useUpdateChat";
import { usePinThread } from "@/hooks/chat/usePinThread";
import { useUnpinThread } from "@/hooks/chat/useUnpinThread";
import { EditableDiv } from "@/components/ui/editable-div";
import { useChatContext } from "@/context/ChatContext";

type Props = {
  data: ThreadSchema;
  selectedThreadId?: string;
  isThreadPinned?: boolean;
  isOwner: boolean;
  isFirstPin: boolean;
  isLastPin: boolean;
  isReordering: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onSelect(threadId: string): void;
  onReorder(direction: "up" | "down"): void;
};

export const ThreadItem: FunctionComponent<Props> = ({
  data: {
    id,
    name,
    user,
    last_message,
    modified_at,
    tag,
    archived: isArchived,
  },
  selectedThreadId,
  isThreadPinned,
  isOwner,
  onSelect,
  onReorder,
  isFirstPin,
  isLastPin,
  isReordering,
  isSelectMode = false,
  isSelected = false,
}) => {
  const { mutate: updateThread, isLoading: isUpdatingChat } = useUpdateChat();
  const { mutate: pinThread, isLoading: isPinning } = usePinThread();
  const { mutate: unpinThread, isLoading: isUnpinning } = useUnpinThread();
  const [nameMode, setNameMode] = useState<"text" | "input">("text");

  const {
    isTranscribingAudio,
    isListening,
    stopListening,
    onTranscribe,
    streaming,
    onCancelAssistantStream,
    isCancellingAssistantStream: isLoadingCancel,
  } = useChatContext();

  const handleDragStart = useCallback((e: DragEvent, threadId: string) => {
    e.dataTransfer.setData("threadId", threadId);
  }, []);

  // Toggle pin state for a chat
  const togglePin = useCallback(() => {
    if (isThreadPinned) {
      unpinThread(
        { threadId: id },
        {
          onSuccess: () => void message.success("Thread unpinned successfully"),
        },
      );
    } else {
      pinThread(
        { threadId: id },
        {
          onSuccess: () => void message.success("Thread pinned successfully"),
        },
      );
    }
  }, [id, isThreadPinned, pinThread, unpinThread]);

  const toggleArchive = useCallback(() => {
    updateThread(
      { id, data: { archived: !isArchived } },
      {
        onSuccess: (_, { data: { archived } }) =>
          void message.success(
            archived
              ? "Thread archived successfully"
              : "Thread unarchived successfully",
          ),
      },
    );
  }, [id, isArchived, updateThread]);

  const editName = useCallback(
    (newName: string) => {
      updateThread(
        { id, data: { name: newName } },
        {
          onSuccess: () =>
            void message.success("Thread name updated successfully"),
        },
      );
    },
    [id, updateThread],
  );

  const handleSelectThread = useCallback(() => {
    if (isListening && !isTranscribingAudio) {
      onTranscribe();
      stopListening();
    }
    if (streaming && !isLoadingCancel) {
      onCancelAssistantStream();
    }
    onSelect(id);
  }, [
    isListening,
    isTranscribingAudio,
    streaming,
    isLoadingCancel,
    onSelect,
    id,
    stopListening,
    onTranscribe,
    onCancelAssistantStream,
  ]);

  return (
    <div
      draggable={nameMode !== "input" && !isSelectMode}
      onDragStart={(e) => handleDragStart(e, id)}
      className={twMerge(
        "relative w-full text-left flex items-center p-1.5 border-b border-gray-200",
        isThreadPinned && "bg-blue-50/50 !pl-1",
        selectedThreadId === id && "bg-blue-100/50",
        tag?.deletedAt && "!bg-red-50",
        "hover:bg-gray-50/80",
      )}
      onClick={handleSelectThread}
    >
      {isThreadPinned && !isSelectMode && (
        <div className="inset-y-0 flex flex-col justify-between mr-1">
          <Button
            variant="text"
            type="text"
            size="small"
            className={twMerge("h-5 w-5 p-0 hover:text-blue-600")}
            icon={<ChevronUpIcon className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-gray-600 hover:text-gray-800" />}
            onClick={(e) => {
              e.stopPropagation();
              onReorder("up");
            }}
            disabled={isFirstPin || isReordering}
          />
          <Button
            variant="text"
            type="text"
            size="small"
            className={twMerge("h-5 w-5 p-0 hover:text-blue-600")}
            icon={<ChevronDownIcon className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-gray-600 hover:text-gray-800" />}
            onClick={(e) => {
              e.stopPropagation();
              onReorder("down");
            }}
            disabled={isLastPin || isReordering}
          />
        </div>
      )}
      
      {isSelectMode && (
        <Checkbox 
          className="mr-2 flex-shrink-0" 
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            handleSelectThread();
          }}
        />
      )}
      
      <Avatar className="h-9 w-9 shrink-0" src={user?.image} />
      <div className="ml-2.5 flex-1 flex flex-col min-w-0 gap-0">
        <div className="flex justify-between items-center gap-2 mb-[-4px]">
          <span className="text-sm font-semibold truncate text-gray-800">{getUserLabel(user)}</span>
          <div className="flex items-center gap-1 lg:gap-1.5 shrink-0">
            <DataAccessTag className="text-[10px] lg:text-[11px]" tag={tag} />
            <span className="text-[9px] lg:text-[10px] text-gray-500 whitespace-nowrap">
              {format(modified_at, "dd MMM HH:mm")}
            </span>
            <div className="flex">
              {isOwner && (
                <Button
                  type="text"
                  shape="circle"
                  className="!p-0"
                  icon={
                    <ArchiveIcon
                      className={twMerge(
                        "h-2.5 w-2.5 lg:h-3 lg:w-3 text-gray-600 hover:text-gray-800",
                        isArchived && "text-blue-600",
                      )}
                    />
                  }
                  loading={isUpdatingChat}
                  disabled={isPinning || isUnpinning}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleArchive();
                  }}
                />
              )}
              <Button
                type="text"
                shape="circle"
                className="!p-0"
                loading={isPinning || isUnpinning}
                disabled={isUpdatingChat}
                icon={
                  <Pin
                    className={twMerge(
                      "h-2.5 w-2.5 lg:h-3 lg:w-3 text-gray-600 hover:text-gray-800",
                      isThreadPinned && "fill-current text-blue-600",
                    )}
                  />
                }
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin();
                }}
              />
            </div>
          </div>
        </div>
        <div className="truncate w-full">
          <EditableDiv
            text={name}
            onEdit={editName}
            onChangeMode={setNameMode}
            classNames={{
              text: "font-medium text-gray-700 hover:text-gray-800 text-[13px] leading-tight",
              input: "text-[13px]",
            }}
            isLoading={isUpdatingChat}
          />
        </div>
        <p className="text-[11px] text-gray-500 truncate w-full min-w-0 leading-snug mt-0.5">
          {last_message}
        </p>
      </div>
    </div>
  );
};
