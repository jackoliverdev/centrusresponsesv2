import { useDeleteDocument } from "@/hooks/documents/useDeleteDocument";
import { App, Button, Checkbox } from "antd";
import { DocumentsSchema, TagItemData } from 'common';
import { formatBytes } from "@/utils";
import { Trash2Icon } from "lucide-react";
import { FunctionComponent, useCallback, useMemo } from "react";
import { WordDocument } from "@/components/icons/WordDocument";
import { AudioDocument } from "@/components/icons/AudioDocument";
import { PDFDocument } from "@/components/icons/PDFDocument";
import { GenericDocument } from "@/components/icons/GenericDoucment";
import { TagInput } from "@/components/app/TagInput";
import { WebpageDocument } from "@/components/icons/WebpageDocument";
import { ExcelDocument } from "@/components/icons/ExcelDocument";
import { TextDocument } from "@/components/icons/TextDocument";
import { useUpdateDocument } from "@/hooks/documents/useUpdateDocument";
import { EditableDiv } from "@/components/ui/editable-div";
import { SuggestedTags } from "@/components/app/SuggestedTags";

export type DocumentProps = DocumentsSchema[number] & {
  isSelected?: boolean;
  isBulkUpdating?: boolean;
  isBulkDeleting?: boolean;
  onSelect?: (selected: boolean) => void;
  onDelete?: (id: string) => void;
  organizationId: number;
};

export const Document: FunctionComponent<DocumentProps> = ({
  id,
  name: filename,
  type,
  documentTag,
  size,
  isSelected,
  isBulkUpdating,
  isBulkDeleting,
  onSelect,
  onDelete,
  organizationId,
}) => {
  const { modal } = App.useApp();

  const { mutate: deleteDocument, isLoading: isLoadingDelete } =
    useDeleteDocument();
  const { mutate: update, isLoading: isLoadingUpdate } = useUpdateDocument();

  const Icon = useMemo(() => {
    const extension = filename?.split(".")?.pop();
    switch (type) {
      case "text":
        switch (extension) {
          case "pdf":
            return PDFDocument;
          case "doc":
          case "docx":
            return WordDocument;
          case "xls":
          case "xlsx":
            return ExcelDocument;
          case "txt":
            return TextDocument;
          default:
            return GenericDocument;
        }
      case "audio":
        return AudioDocument;
      case "website":
        return WebpageDocument;
      default:
        return GenericDocument;
    }
  }, [type, filename]);

  const name = useMemo(() => {
    return filename;
  }, [filename]);

  const updateTag = useCallback(
    (tagData: TagItemData) => {
      update({
        id,
        data: {},
        tagData
      });
    },
    [update, id],
  );

  const updateName = useCallback(
    (newName: string) => {
      const extension = filename.split(".").pop();
      const nameAndExt = newName.endsWith(`.${extension}`)
        ? newName
        : `${newName}.${extension}`;
      update({ id, data: { name: nameAndExt } });
    },
    [filename, update, id],
  );

  const tagsSection = (
    <div className="flex items-center space-x-2 flex-1">
      <TagInput
        onSubmit={updateTag}
        existingTag={documentTag}
        disabled={isBulkDeleting || isBulkUpdating || isLoadingDelete}
        loading={isLoadingUpdate || (isBulkUpdating && isSelected)}
      />
      <SuggestedTags
        documentId={id}
        organizationId={organizationId}
        onSelectTag={updateTag}
        existingTag={documentTag}
      />
    </div>
  );
  const moreButton = null;
  const deleteButton = (
    <Button
      type="text"
      variant="text"
      color="danger"
      className="min-w-[2.625rem]"
      disabled={isBulkUpdating && isSelected}
      loading={isLoadingDelete || (isBulkDeleting && isSelected)}
      icon={<Trash2Icon className="h-4 w-4" />}
      onClick={async () => {
        await modal.confirm({
          title: "Delete File",
          content: "Are you sure you want to delete this file?",
          okText: "Delete",
          okType: "danger",
          okButtonProps: { variant: "filled" },
          onOk() {
            deleteDocument(
              { id },
              {
                onSuccess(_, { id: itemId }) {
                  onDelete?.(itemId);
                },
              },
            );
          },
        });
      }}
    />
  );
  return (
    <>
      <div className="items-center justify-between lg:p-3 bg-white hidden lg:flex hover:bg-gray-50">
        <Checkbox
          className="ml-2"
          checked={isSelected}
          onChange={(e) => {
            if (e.target.checked && !isSelected) onSelect?.(true);
            else onSelect?.(false);
          }}
          disabled={isBulkUpdating || isBulkDeleting}
        />
        <div className="flex items-center space-x-4 max-w-96 w-full px-4">
          <Icon className="shrink-0" />
          <EditableDiv
            text={name}
            onEdit={updateName}
            classNames={{
              text: "font-medium truncate flex-1",
            }}
            isLoading={isLoadingUpdate}
          />
        </div>

        <div className="text-sm text-gray-500 flex-1">{formatBytes(size)}</div>
        {tagsSection}

        <div className="flex items-center gap-4">
          {moreButton} {deleteButton}
        </div>
      </div>
      <div className="lg:hidden bg-white border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 max-w-96 w-full truncate">
            <Checkbox
              checked={isSelected}
              onChange={(e) => {
                if (e.target.checked && !isSelected) onSelect?.(true);
                else onSelect?.(false);
              }}
              disabled={isBulkUpdating || isBulkDeleting}
            />
            <Icon className="shrink-0" />
            <EditableDiv
              text={name}
              onEdit={updateName}
              classNames={{
                text: "font-medium truncate flex-1",
              }}
              isLoading={isLoadingUpdate}
            />
          </div>
          {moreButton}
        </div>
        {tagsSection}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 flex-1">
            {formatBytes(size)}
          </div>
          {deleteButton}
        </div>
      </div>
    </>
  );
};
