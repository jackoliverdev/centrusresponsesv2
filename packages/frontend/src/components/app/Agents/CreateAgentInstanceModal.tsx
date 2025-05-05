import React, { FC, useEffect, useCallback } from "react";
import { useAgentInstances } from "@/hooks/useAgentInstances";
import { Modal, Button, Input, Form, message } from "antd";
import { Bot } from "lucide-react";
import { useRouter } from "next/router";
import { USER_APP_ROUTES } from '@/routing/routes';

interface CreateAgentInstanceModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentType: string;
}

const CreateAgentInstanceModal: FC<CreateAgentInstanceModalProps> = ({
  open,
  onClose,
  agentId,
  agentType,
}) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const { createInstance } = useAgentInstances(agentType);
  const isCreating = createInstance.isLoading;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleCreate = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const result = await createInstance.mutateAsync({
        name: values.name.trim(),
        type: agentId
      });
      
      if (result?.id) {
        // Navigate to the agent instance page
        router.push(USER_APP_ROUTES.getPath("agentInstance", { 
          type: agentType,
          instanceId: result.id.toString()
        }));
        message.success("Instance created successfully.");
      }
      onClose();
    } catch (error) {
      console.error("Failed to create instance:", error);
      message.error("Failed to create instance. Please try again.");
    }
  }, [createInstance, agentId, agentType, router, onClose, form]);

  return (
    <Modal
      title="Create New Instance"
      open={open}
      onCancel={onClose}
      width={500}
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
          label="Instance Name"
          rules={[
            {
              required: true,
              message: "Please enter an instance name",
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
            placeholder="Enter a name for this instance"
            size="large"
            prefix={<Bot className="h-5 w-5 text-primary" />}
          />
        </Form.Item>

        <div className="flex justify-end gap-4 mt-10">
          <Button disabled={isCreating} onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" loading={isCreating} htmlType="submit">
            Create
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateAgentInstanceModal; 