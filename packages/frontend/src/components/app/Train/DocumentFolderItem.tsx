import { useState, DragEvent, useCallback, useMemo, FunctionComponent } from 'react';
import { ChevronRight, ChevronDown, Folder, Trash2Icon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { DocumentFolderPreview } from "./DocumentFolderPreview";
import { DocumentsSchema, FolderWithDocumentsSchema } from "common";
import { Button, message, Popconfirm } from "antd";
import { isDocumentInFolder } from "@/utils/documentHelpers";
import { EditDocumentFolderMenu } from "@/components/app/Train/EditDocumentFolderMenu";
import { useDeleteDocumentFolder } from "@/hooks/document/useDeleteDocumentFolder";
import { useAuthContext } from "@/context/AuthContext";

type Props = {
  folder: FolderWithDocumentsSchema;
  documents: DocumentsSchema;
  isActive: boolean;
  isUpdating: boolean;
  onSelect: (folderId?: number) => void;
  onDocumentSelect: (documentId: string) => void;
  onDrop: (
    documentId: string,
    folderId: number,
    moveFromFolderId?: number,
  ) => void;
};

export const DocumentFolderItem: FunctionComponent<Props> = ({
  folder,
  documents,
  isActive,
  onSelect,
  onDocumentSelect,
  onDrop,
  isUpdating,
}) => {
  const { isOrgAdmin, isPlatformAdmin, user } = useAuthContext();
  const { mutate: deleteFolder, isLoading: isDeleting } =
    useDeleteDocumentFolder();
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
      const documentId = e.dataTransfer.getData("documentId");
      const moveFromFolderId = Number(
        e.dataTransfer.getData("moveFromFolderId"),
      );
      if (documentId && isDocumentInFolder(documentId, folder)) {
        // drag within same folder
        return;
      }
      if (documentId) {
        if (moveFromFolderId) {
          // move from one folder to another
          onDrop(documentId, folder.id, moveFromFolderId);
          return;
        }
        onDrop(documentId, folder.id);
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
        "relative px-2.5 py-1.5 rounded hover:bg-gray-100 transition-colors group",
        isActive && "bg-gray-100",
        isOver && !isActive && "bg-gray-50/50",
        isUpdating && "opacity-60 pointer-events-none",
      )}
      draggable={false}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex flex-1 items-center gap-2 cursor-pointer"
          onClick={() => {
            if (isActive) {
              setIsCollapsed((prev) => !prev);
            } else {
              onSelect(folder.id);
              setIsCollapsed(false);
            }
          }}
        >
          <button
            type="button"
            className="p-0.5 text-gray-600 hover:text-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed((prev) => !prev);
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          <Folder
            className="h-4 w-4 text-gray-500"
            style={{ color: folder.color }}
          />
          <span className="flex-1 truncate text-sm">{folder.name}</span>
          <span className="text-xs text-gray-500 mr-2">{folder.documents.length}</span>
        </div>
        <div
          className={twMerge(
            "invisible group-hover:visible flex items-center",
            confirmDelete && "!visible",
          )}
        >
          {userCanUpdate && (
            <>
              <EditDocumentFolderMenu folder={folder} />
              {confirmDelete ? (
                <Popconfirm
                  title="Delete this folder?"
                  description="Documents won't be deleted."
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                  open={confirmDelete}
                  onConfirm={handleFolderDelete}
                  onCancel={() => setConfirmDelete(false)}
                  placement="bottomRight"
                  okType="danger"
                >
                  <Button
                    type="text"
                    variant="text"
                    className="text-red-500 hover:text-red-700 ml-1 p-1 h-auto"
                    onClick={(e) => e.stopPropagation()}
                    loading={isDeleting}
                    disabled={isDeleting}
                    icon={<Trash2Icon className="size-3.5" />}
                  />
                </Popconfirm>
              ) : (
                <Button
                  type="text"
                  variant="text"
                  className="text-gray-500 hover:text-red-700 ml-1 p-1 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(true);
                  }}
                  icon={<Trash2Icon className="size-3.5" />}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div
        className={twMerge(
          "pl-4 space-y-1 mt-1 overflow-hidden transition-all",
          isCollapsed ? "h-0 mt-0" : "h-auto",
        )}
      >
        {folder.documents.length === 0 ? (
          <div className="text-xs text-gray-500 py-1">No documents</div>
        ) : (
          folder.documents.map((document) => {
            const fullDocument = documents.find((d) => d.id === document.id);
            if (!fullDocument) return null;
            return (
              <DocumentFolderPreview
                key={document.id}
                document={fullDocument}
                onClick={() => onDocumentSelect(document.id)}
                folderId={folder.id}
              />
            );
          })
        )}
      </div>
    </div>
  );
};