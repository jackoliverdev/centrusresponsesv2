import { useState, useCallback, FunctionComponent } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { message, Skeleton, Tooltip, Button } from "antd";
import { CreateDocumentFolderModal } from "@/components/app/Train/CreateDocumentFolderModal";
import { DocumentFolderItem } from "@/components/app/Train/DocumentFolderItem";
import { useAttachDocumentToFolder } from "@/hooks/document/useAttachDocumentToFolder";
import { isDocumentInFolder } from "@/utils/documentHelpers";
import { useDetachDocumentFromFolder } from "@/hooks/document/useDetachDocumentFromFolder";
import { DocumentsSchema, FolderWithDocumentsSchema } from "common";

type Props = {
  folders: FolderWithDocumentsSchema[];
  documents: DocumentsSchema;
  selectedFolderId?: number;
  isLoading: boolean;
  isError: boolean;
  onFolderSelect: (folderId?: number) => void;
  onDocumentSelect: (documentId: string) => void;
  className?: string;
};

export const DocumentFolderList: FunctionComponent<Props> = ({
  folders,
  documents,
  isLoading,
  isError,
  selectedFolderId,
  onFolderSelect,
  onDocumentSelect,
  className,
}) => {
  const { mutate: attachFolder, isLoading: isAttachingFolder } =
    useAttachDocumentToFolder();
  const { mutate: detachFolder, isLoading: isDetachingFolder } =
    useDetachDocumentFromFolder();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(false);
  const [attachingFolderId, setAttachingFolderId] = useState<number>();
  const [detachingFolderId, setDetachingFolderId] = useState<number>();

  const handleDrop = useCallback(
    (documentId: string, folderId: number, moveFromFolderId?: number) => {
      const folder = folders.find((f) => f.id === folderId);

      if (isDocumentInFolder(documentId, folder)) {
        return;
      }

      setAttachingFolderId(folderId);

      attachFolder(
        { documentId, folderId },
        {
          onSuccess: () => {
            return void message.success("Document successfully added to folder.");
          },
          onError: () =>
            void message.error(
              "Failed to add document to folder. Please try again",
            ),
          onSettled: () => {
            setAttachingFolderId(undefined);
          },
        }
      );

      // move from one folder to another
      if (moveFromFolderId) {
        setDetachingFolderId(moveFromFolderId);
        detachFolder(
          { folderId: moveFromFolderId, documentId },
          {
            onSettled: () => {
              setDetachingFolderId(undefined);
            },
          }
        );
      }
    },
    [attachFolder, detachFolder, folders]
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
      <div className="text-center text-red-500 text-sm py-2">
        Error loading folders
      </div>
    );
  }

  return (
    <div className={twMerge("space-y-0.5", className)}>
      <div className="flex items-center justify-between px-2">
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => setIsSectionCollapsed(!isSectionCollapsed)}
        >
          <div className="p-0.5 text-gray-600">
            {isSectionCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </div>
          <h3 className="text-sm font-medium">Folders</h3>
        </div>

        <Tooltip title="Create folder">
          <Button
            type="text"
            size="small"
            className={twMerge("h-6 w-6 p-0 transition-opacity")}
            onClick={(e) => {
              e.stopPropagation();
              setShowCreateModal(true);
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </Tooltip>
      </div>

      <div
        className={twMerge(
          "space-y-0.5 transition-all",
          isSectionCollapsed ? "h-0 overflow-hidden" : "h-auto"
        )}
      >
        {!folders.length ? (
          <div className="text-xs text-gray-500 text-center py-2 lg:py-4">
            No folders yet
          </div>
        ) : (
          folders.map((folder) => (
            <DocumentFolderItem
              key={folder.id}
              documents={documents}
              folder={folder}
              isActive={folder.id === selectedFolderId}
              isUpdating={
                (folder.id === attachingFolderId && isAttachingFolder) ||
                (folder.id === detachingFolderId && isDetachingFolder)
              }
              onSelect={onFolderSelect}
              onDocumentSelect={onDocumentSelect}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>

      <div className="h-px bg-gray-200/75 mt-0.5 lg:mt-2" />

      <CreateDocumentFolderModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
