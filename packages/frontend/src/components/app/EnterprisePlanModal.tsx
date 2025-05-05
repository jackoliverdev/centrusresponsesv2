"use client";

import { useEffect, FunctionComponent, useState, useCallback } from "react";
import { useSubmit } from "@formspree/react";
import { Modal, Button, Form, App, Input } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useAuthContext } from "@/context/AuthContext";
import { getUserLabel } from "@/utils/user";
import { useOrganizationContext } from "@/context/OrganizationContext";

const FORMSPREE_ID = process.env.NEXT_PUBLIC_ENTERPRISE_FORMSPREE_ID ?? "";

type Props = {
  open: boolean;
  onClose(): void;
};

export const EnterprisePlanModal: FunctionComponent<Props> = ({
  onClose,
  open,
}) => {
  const { notification } = App.useApp();
  const [form] = Form.useForm<{
    contactName: string;
    contactEmail: string;
    companyName: string;
    phoneNumber: string;
    message: string;
    id: number;
  }>();
  const values = Form.useWatch([], form);
  const { user } = useAuthContext();
  const { currentOrganization } = useOrganizationContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = useSubmit(FORMSPREE_ID, {
    onSuccess() {
      notification.success({
        message: "Success",
        description: "Message sent successfully! We will contact you shortly.",
      });
      onClose()
    },
    onError() {
      notification.error({
        message: "Error",
        description: "Failed to send message. Please try again.",
      });
    },
  });

  const onSubmit = useCallback(async () => {
    setIsSubmitting(true);
    await handleSubmit(values);
    setIsSubmitting(false);
  }, [handleSubmit, values]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    } else {
      form.setFieldsValue({});
    }
  }, [form, open]);

  return (
    <Modal
      open={open}
      centered
      footer={null}
      title={<h2 className="text-xl font-bold">Contact Sales</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      closable={!isSubmitting}
      maskClosable={!isSubmitting}
      keyboard={!isSubmitting}
      onCancel={() => onClose()}
    >
      {open && user && (
        <>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            disabled={isSubmitting}
            onFinish={onSubmit}
          >
            <Form.Item name="id" initialValue={user.id} noStyle />

            <Form.Item
              name="contactName"
              label="Contact Name"
              initialValue={getUserLabel(user)}
              className="w-full"
              rules={[
                {
                  type: "string",
                  required: true,
                  message: "Contact name is required",
                  min: 1,
                },
              ]}
            >
              <Input size="large" className="w-full" readOnly />
            </Form.Item>

            <Form.Item
              name="contactEmail"
              label="Contact Email"
              initialValue={user.email}
              className="w-full"
              rules={[
                {
                  type: "email",
                  required: true,
                  message: "Invalid email address",
                },
              ]}
            >
              <Input
                type="email"
                placeholder="john@example.com"
                size="large"
                className="w-full"
                readOnly
              />
            </Form.Item>

            <Form.Item
              name="companyName"
              label="Company Name"
              initialValue={currentOrganization?.name}
              className="w-full"
              rules={[
                {
                  type: "string",
                  required: true,
                  min: 1,
                },
              ]}
            >
              <Input
                placeholder="Acme Inc."
                size="large"
                className="w-full"
                readOnly
              />
            </Form.Item>

            <Form.Item
              name="phoneNumber"
              label="Phone Number (Optional)"
              initialValue={user.phone}
              className="w-full"
              rules={[
                {
                  type: "string",
                  required: false,
                },
              ]}
            >
              <Input placeholder="+" size="large" className="w-full" />
            </Form.Item>

            <Form.Item
              name="message"
              label="Message"
              className="w-full"
              rules={[
                {
                  type: "string",
                  required: true,
                },
                {
                  min: 10,
                  message: "Please provide more details about your needs",
                },
              ]}
            >
              <Input.TextArea
                placeholder="Tell us about your needs..."
                size="large"
                className="w-full"
                autoSize={{
                  maxRows: 6,
                  minRows: 4,
                }}
              />
            </Form.Item>

            <div className="flex justify-end flex-wrap-reverse items-stretch sm:items-center gap-4 mt-4">
              <Button
                className="flex-1 sm:flex-grow-0"
                disabled={isSubmitting}
                onClick={() => onClose()}
              >
                Cancel
              </Button>
              <Button
                htmlType="submit"
                type="primary"
                className="flex-1 sm:flex-grow-0"
                loading={isSubmitting}
              >
                Send Message
              </Button>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};
