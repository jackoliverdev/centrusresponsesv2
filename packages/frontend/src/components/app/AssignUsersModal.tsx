"use client";

import { FunctionComponent, useCallback, useMemo, useState, useEffect } from "react";
import { Modal, Table, Avatar, Tag as AntTag, Button } from "antd";
import { OrganizationMemberSchema, TagSchema } from "common";
import { useOrganizationMembers } from "@/hooks/organization/useOrganizationMembers";
import { DataAccessTag } from "./DataAccessTag";
import { ColumnsType } from "antd/es/table";
import { UserOutlined } from "@ant-design/icons";
import { useAssignUserToTag } from "@/hooks/tags/useAssignUserToTag";
import { useQueryClient } from "react-query";

type Props = {
  open: boolean;
  onClose: () => void;
  currentTag: TagSchema;
  currentUsers: { user: { id: number } }[];
};

export const AssignUsersModal: FunctionComponent<Props> = ({
  open,
  onClose,
  currentTag,
  currentUsers,
}) => {
  const { data: members = [], isLoading } = useOrganizationMembers();
  const { mutate: assignUser, isLoading: isAssigning } = useAssignUserToTag();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const queryClient = useQueryClient();

  // Initialize selected users when modal opens
  useEffect(() => {
    if (open) {
      setSelectedUsers(currentUsers.map(u => u.user.id));
    }
  }, [open, currentUsers]);

  const handleApply = useCallback(async () => {
    // Get currently assigned users
    const currentlyAssignedUsers = currentUsers.map(u => u.user.id);

    // Find users to add and remove
    const usersToAdd = selectedUsers.filter(
      id => !currentlyAssignedUsers.includes(id)
    );
    const usersToRemove = currentlyAssignedUsers.filter(
      id => !selectedUsers.includes(id)
    );

    setIsApplying(true);

    try {
      // Create an array of promises for all updates
      const updatePromises = [
        // Add users to tag
        ...usersToAdd.map(userId =>
          new Promise((resolve, reject) => {
            assignUser(
              {
                userId,
                tagId: currentTag.id,
                action: 'assign'
              },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          })
        ),
        // Remove users from tag
        ...usersToRemove.map(userId =>
          new Promise((resolve, reject) => {
            assignUser(
              {
                userId,
                tagId: currentTag.id,
                action: 'unassign'
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
      await queryClient.invalidateQueries(["tags-info"]);
      await queryClient.invalidateQueries(["organizationMembers"]);

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error updating user assignments:", error);
    } finally {
      setIsApplying(false);
    }
  }, [selectedUsers, currentUsers, currentTag.id, assignUser, queryClient, onClose]);

  const columns: ColumnsType<OrganizationMemberSchema> = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar src={record.image} icon={<UserOutlined />} />
          <div>
            <div className="text-sm font-medium">
              {record.firstName} {record.lastName}
            </div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <AntTag color={role === "admin" ? "blue" : undefined}>{role}</AntTag>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title="Assign Users"
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
          Select users to assign to tag:{" "}
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
          selectedRowKeys: selectedUsers,
          onChange: (selectedRowKeys) => {
            setSelectedUsers(selectedRowKeys as number[]);
          },
          getCheckboxProps: () => ({
            disabled: isApplying
          })
        }}
        columns={columns}
        dataSource={members}
        loading={isLoading || isApplying}
        rowKey="id"
        size="small"
        pagination={false}
        className="mb-6"
      />
    </Modal>
  );
}; 