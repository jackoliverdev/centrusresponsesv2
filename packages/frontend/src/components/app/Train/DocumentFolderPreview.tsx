import React, { DragEvent, FunctionComponent, useCallback } from "react";
import { DocumentSchema } from "common";
import { FileTextIcon, Music2Icon, FileIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
  document: DocumentSchema;
  onClick: () => void;
  folderId: number;
};

export const DocumentFolderPreview: FunctionComponent<Props> = ({
  document,
  onClick,
  folderId,
}) => {
  const handleDragStart = useCallback(
    (e: DragEvent) => {
      e.dataTransfer.setData("documentId", document.id);
      e.dataTransfer.setData("moveFromFolderId", folderId.toString());
    },
    [document.id, folderId],
  );

  const getDocumentIcon = () => {
    switch (document.type) {
      case "text":
        return <FileTextIcon className="h-3.5 w-3.5 text-gray-500" />;
      case "audio":
        return <Music2Icon className="h-3.5 w-3.5 text-gray-500" />;
      default:
        return <FileIcon className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  return (
    <div
      className={twMerge(
        "flex items-center gap-2 p-1.5 rounded hover:bg-gray-200 transition-colors cursor-pointer",
        "text-xs truncate"
      )}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
    >
      {getDocumentIcon()}
      <span className="truncate flex-1">{document.name}</span>
      {document.documentTag && (
        <span
          className="px-1.5 py-0.5 rounded text-[0.6rem] font-medium truncate"
          style={{
            backgroundColor: document.documentTag.backgroundColor,
            color: document.documentTag.textColor,
          }}
        >
          {document.documentTag.name}
        </span>
      )}
    </div>
  );
}; 