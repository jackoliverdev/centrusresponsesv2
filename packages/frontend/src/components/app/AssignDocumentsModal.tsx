"use client";

import { FunctionComponent, useCallback, useMemo, useState, useEffect } from "react";
import { Modal, Table, Button, Tag as AntTag } from "antd";
import { DocumentSchema, TagSchema } from "common";
import { useDocuments } from "@/hooks/documents/useDocuments";
import { useUpdateDocument } from "@/hooks/documents/useUpdateDocument";
import { DataAccessTag } from "./DataAccessTag";
import { ColumnsType } from "antd/es/table";
import { useQueryClient } from "react-query";

type Props = {
  open: boolean;
  onClose: () => void;
  currentTag: TagSchema;
};

export const AssignDocumentsModal: FunctionComponent<Props> = ({
  open,
  onClose,
  currentTag,
}) => {
  const { data: documents = [], isLoading } = useDocuments();
  const { mutate: updateDocument, isLoading: isUpdating } = useUpdateDocument();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const queryClient = useQueryClient();

  // Initialize selected docs when modal opens
  useEffect(() => {
    if (open) {
      setSelectedDocs(
        documents
          .filter((doc) => doc.documentTag?.id === currentTag.id)
          .map((doc) => doc.id)
      );
    }
  }, [open, documents, currentTag.id]);

  const handleApply = useCallback(async () => {
    // Get currently assigned docs
    const currentlyAssignedDocs = documents
      .filter((doc) => doc.documentTag?.id === currentTag.id)
      .map((doc) => doc.id);

    // Find docs to add and remove
    const docsToAdd = selectedDocs.filter(
      (id) => !currentlyAssignedDocs.includes(id)
    );
    const docsToRemove = currentlyAssignedDocs.filter(
      (id) => !selectedDocs.includes(id)
    );

    setIsApplying(true);

    try {
      // Create an array of promises for all updates
      const updatePromises = [
        // Add tag to newly selected docs
        ...docsToAdd.map((docId) =>
          new Promise((resolve, reject) => {
            updateDocument(
              {
                id: docId,
                data: {},
                tagData: {
                  id: currentTag.id,
                  name: currentTag.name,
                  backgroundColor: currentTag.backgroundColor,
                  textColor: currentTag.textColor,
                },
              },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          })
        ),
        // Remove tag from unselected docs
        ...docsToRemove.map((docId) =>
          new Promise((resolve, reject) => {
            updateDocument(
              {
                id: docId,
                data: {},
                tagData: undefined,
              },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          })
        ),
      ];

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Invalidate relevant queries to refresh the data
      await queryClient.invalidateQueries(["documents"]);
      await queryClient.invalidateQueries(["tags-info"]);

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error updating documents:", error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedDocs, documents, currentTag, updateDocument, queryClient, onClose]);

  const columns: ColumnsType<DocumentSchema> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="text-sm">{text}</span>,
    },
    {
      title: "Current Tag",
      key: "tag",
      render: (_, record) =>
        record.documentTag ? (
          <DataAccessTag
            tag={{
              name: record.documentTag.name,
              backgroundColor: record.documentTag.backgroundColor,
              textColor: record.documentTag.textColor,
            }}
          />
        ) : (
          <AntTag>Unassigned</AntTag>
        ),
    },
  ];

  return (
    <Modal
      open={open}
      title="Assign Documents"
      onCancel={onClose}
      width={800}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={isApplying}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleApply}
            loading={isApplying}
          >
            Apply Changes
          </Button>
        </div>
      }
      closable={!isApplying}
      maskClosable={!isApplying}
    >
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Select documents to assign to tag:{" "}
          <DataAccessTag
            tag={{
              name: currentTag.name,
              backgroundColor: currentTag.backgroundColor,
              textColor: currentTag.textColor,
            }}
          />
        </p>
      </div>
      <Table
        rowSelection={{
          type: "checkbox",
          selectedRowKeys: selectedDocs,
          onChange: (selectedRowKeys) => {
            setSelectedDocs(selectedRowKeys as string[]);
          },
          getCheckboxProps: () => ({
            disabled: isApplying
          })
        }}
        columns={columns}
        dataSource={documents}
        loading={isLoading || isApplying}
        rowKey="id"
        size="small"
        pagination={false}
        className="mb-6"
      />
    </Modal>
  );
}; 