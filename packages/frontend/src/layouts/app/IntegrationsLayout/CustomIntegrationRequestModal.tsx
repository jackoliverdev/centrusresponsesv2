"use client";

import { useEffect, FunctionComponent, useState, useCallback } from "react";
import { Modal, Button, Form, App, Input, Upload } from "antd";
import { CloseOutlined, UploadOutlined } from "@ant-design/icons";
import { useAuthContext } from "@/context/AuthContext";
import { getUserLabel } from "@/utils/user";
import { useOrganizationContext } from "@/context/OrganizationContext";
import { RcFile } from 'antd/es/upload';

// FormSpree ID from user request
const FORMSPREE_ID = "xgvaqngl";

// Acceptable file types
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg";

type Props = {
  open: boolean;
  onClose(): void;
};

export const CustomIntegrationRequestModal: FunctionComponent<Props> = ({
  onClose,
  open,
}) => {
  const { notification } = App.useApp();
  const [form] = Form.useForm<{
    contactName: string;
    contactEmail: string;
    companyName: string;
    phoneNumber: string;
    integrationType: string;
    integrationDetails: string;
    attachment: { file: RcFile, fileList: RcFile[] };
    userId: number;
  }>();
  const values = Form.useWatch([], form);
  const { user } = useAuthContext();
  const { currentOrganization } = useOrganizationContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const onSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    
    // Add all form fields to formData
    formData.append("contactName", values.contactName);
    formData.append("contactEmail", values.contactEmail);
    formData.append("companyName", values.companyName);
    formData.append("phoneNumber", values.phoneNumber || "");
    formData.append("integrationType", values.integrationType);
    formData.append("integrationDetails", values.integrationDetails);
    formData.append("userId", values.userId?.toString() || "");
    formData.append("requestType", "Custom Integration Request");
    
    // Add attachment if present
    if (values.attachment?.file) {
      formData.append("attachment", values.attachment.file);
    }
    
    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        notification.error({
          message: "Error",
          description: "Failed to send request. Please try again.",
        });
      } else {
        notification.success({
          message: "Success",
          description: "Your custom integration request has been submitted! We'll be in touch soon to discuss your requirements.",
        });
        onClose();
      }
    } catch (e) {
      notification.error({
        message: "Error",
        description: "Failed to send request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, notification, onClose]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    } else if (user) {
      form.setFieldsValue({
        contactName: getUserLabel(user),
        contactEmail: user.email,
        companyName: currentOrganization?.name || "",
        phoneNumber: user.phone || "",
        userId: user.id
      });
    }
  }, [form, open, user, currentOrganization]);

  return (
    <Modal
      open={open}
      centered
      width={620}
      footer={null}
      title={<h2 className="text-xl font-bold">Request a Custom Integration</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      closable={!isSubmitting}
      maskClosable={!isSubmitting}
      keyboard={!isSubmitting}
      onCancel={() => onClose()}
    >
      {open && user && (
        <>
          <p className="mb-3 text-muted-foreground">
            Tell us about the custom integration you need, and our team will work with you to build it.
          </p>
          
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            disabled={isSubmitting}
            onFinish={onSubmit}
            className="space-y-3"
          >
            <Form.Item name="userId" initialValue={user.id} noStyle />

            <div className="grid grid-cols-2 gap-3">
              <Form.Item
                name="contactName"
                label="Contact Name"
                initialValue={getUserLabel(user)}
                className="w-full mb-1"
                rules={[
                  {
                    type: "string",
                    required: true,
                    message: "Contact name is required",
                    min: 1,
                  },
                ]}
              >
                <Input size="middle" className="w-full" readOnly />
              </Form.Item>

              <Form.Item
                name="contactEmail"
                label="Contact Email"
                initialValue={user.email}
                className="w-full mb-1"
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
                  placeholder="name@example.com"
                  size="middle"
                  className="w-full"
                  readOnly
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item
                name="companyName"
                label="Company Name"
                initialValue={currentOrganization?.name}
                className="w-full mb-1"
                rules={[
                  {
                    type: "string",
                    required: true,
                    min: 1,
                  },
                ]}
              >
                <Input
                  placeholder="Acme Ltd."
                  size="middle"
                  className="w-full"
                  readOnly
                />
              </Form.Item>

              <Form.Item
                name="phoneNumber"
                label="Phone Number (Optional)"
                initialValue={user.phone}
                className="w-full mb-1"
              >
                <Input placeholder="+" size="middle" className="w-full" />
              </Form.Item>
            </div>

            <Form.Item
              name="integrationType"
              label="Integration Type"
              className="w-full mb-1"
              rules={[
                {
                  type: "string",
                  required: true,
                  message: "Please describe the integration you're requesting",
                  min: 3,
                },
              ]}
            >
              <Input.TextArea
                placeholder="E.g., Slack, Microsoft Teams, Gmail, Custom CRM, etc."
                size="middle"
                className="w-full"
                autoSize={{ minRows: 2 }}
              />
            </Form.Item>

            <Form.Item
              name="integrationDetails"
              label="Integration Details"
              className="w-full mb-1"
              rules={[
                {
                  type: "string",
                  required: true,
                  message: "Please provide more details about your integration needs",
                  min: 20,
                },
              ]}
            >
              <Input.TextArea
                placeholder="Describe how you want this integration to work, specific requirements, and what you want to accomplish..."
                size="middle"
                className="w-full"
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>

            <Form.Item 
              name="attachment"
              label="Supporting Documents (Optional)"
              className="w-full mb-1"
            >
              <Upload 
                maxCount={1} 
                accept={ACCEPTED_FILE_TYPES}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Upload File</Button>
              </Upload>
            </Form.Item>

            <div className="flex justify-end space-x-3 mt-4">
              <Button 
                onClick={() => onClose()} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={() => form.submit()} 
                loading={isSubmitting}
              >
                Submit Request
              </Button>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default CustomIntegrationRequestModal; 