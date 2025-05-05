import React, { FunctionComponent, useEffect, useCallback } from "react";
import { Modal, Button, Input, Form, message } from "antd";
import { Check, FolderIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { COLORS, FolderSchema } from "common";
import { useCreateThreadFolder } from "@/hooks/chat/useCreateThreadFolder";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (folderId: number) => void;
};

export const CreateThreadFolderModal: FunctionComponent<Props> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { isLoading: isCreating, mutate: createFolder } =
    useCreateThreadFolder();
  const [form] =
    Form.useForm<Pick<FolderSchema, "name" | "color" | "global">>();
  const selectedColor = Form.useWatch(["color"], form);

  const handleCreate = useCallback(async () => {
    const { name, ...data } = form.getFieldsValue();
    createFolder(
      { ...data, name: name.trim() },
      {
        onSuccess: (response) => {
          onClose();
          if (onSuccess && response?.id) {
            onSuccess(response.id);
          }
          return void message.success("Thread folder created successfully.");
        },
        onError: () =>
          void message.error("Failed to create folder. Please try again"),
      },
    );
  }, [form, createFolder, onClose, onSuccess]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        color: COLORS[0],
        name: "",
        global: false,
      });
    } else {
      form.resetFields();
    }
  }, [form, open]);

  return (
    <Modal
      title="Create New Folder"
      open={open}
      onCancel={onClose}
      width={400}
      maskClosable={!isCreating}
      closable={!isCreating}
      keyboard={!isCreating}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        disabled={isCreating}
        onFinish={handleCreate}
      >
        <Form.Item
          name="name"
          label="Folder Name"
          rules={[
            {
              required: true,
              message: "Please input folder name",
              type: "string",
            },
            {
              message: "30 characters maximum",
              type: "string",
              max: 30,
            },
          ]}
        >
          <Input
            placeholder="Enter folder name"
            size="large"
            prefix={
              <FolderIcon className="size-6" style={{ color: selectedColor }} />
            }
          />
        </Form.Item>

        <Form.Item name="color" label="Folder Color">
          <div className="grid grid-cols-8 gap-2">
            {COLORS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => form.setFieldValue("color", color)}
                className={twMerge(
                  "w-8 h-8 rounded-full transition-transform flex items-center justify-center",
                  "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  selectedColor === color &&
                    "ring-2 ring-offset-2 ring-blue-500",
                  isCreating && "opacity-50 cursor-not-allowed",
                )}
                style={{ backgroundColor: color }}
                disabled={isCreating}
              >
                {selectedColor === color && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>
        </Form.Item>

        <Form.Item name="global" label="" noStyle />

        <div className="flex justify-end gap-4 mt-10">
          <Button disabled={isCreating} onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" loading={isCreating} htmlType="submit">
            Create Folder
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
