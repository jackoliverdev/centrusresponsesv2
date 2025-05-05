"use client";

import React, {
  useEffect,
  FunctionComponent,
  useState,
  useCallback,
} from "react";
import { Button, Form, App, Input, Upload, Select } from "antd";
import { useAuthContext } from "@/context/AuthContext";
import { getUserLabel } from "@/utils/user";
import { PRIORITIES } from "@/utils/constants";
import { RcFile } from 'antd/es/upload';
import { ALL_MIMES } from 'common';

const FORMSPREE_ID = process.env.NEXT_PUBLIC_SUPPORT_FORMSPREE_ID ?? "";

type Props = object;

export const HelpSupport: FunctionComponent<Props> = () => {
  const { notification } = App.useApp();
  const [form] = Form.useForm<{
    name: string;
    userName: string;
    email: string;
    priority: "low" | "medium" | "high" | "urgent";
    message: string;
    attachment: { file: RcFile, fileList: RcFile[]; };
    userId: number;
  }>();
  const values = Form.useWatch([], form);
  const { user } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("userName", values.userName);
    formData.append("email", values.email);
    formData.append("priority", values.priority);
    formData.append("message", values.message);
    formData.append("userId", values.userId.toString());
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
          description: "Failed to send message. Please try again.",
        });
      } else {
        notification.success({
          message: "Success",
          description:
            "Thanks for reaching out! Keep an eye on your email, We'll get back to you within 24-48 hours.",
        });
        form.resetFields(["message", "attachment", "priority"]);
      }
    } catch (e) {
      notification.error({
        message: "Error",
        description: "Failed to send message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [form, notification, values]);

  useEffect(() => {
    if (user) {
      form.resetFields();
    }
  }, [form, user]);

  if (!user) return;

  return (
    <>
      <h2 className="text-xl font-bold">Need More Help?</h2>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        disabled={isSubmitting}
        onFinish={onSubmit}
      >
        <Form.Item name="userId" initialValue={user.id} noStyle />
        <Form.Item name="userName" initialValue={getUserLabel(user)} noStyle />

        <Form.Item
          name="name"
          label="Name"
          initialValue={getUserLabel(user)}
          className="w-full"
          rules={[
            {
              type: "string",
              required: true,
              message: "Name is required",
              min: 1,
            },
          ]}
        >
          <Input size="large" className="w-full" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
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
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          initialValue={"medium"}
          className="w-full"
          rules={[
            {
              type: "string",
              required: true,
            },
          ]}
        >
          <Select options={PRIORITIES} />
        </Form.Item>

        <Form.Item
          name="message"
          label="Issue"
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
            size="large"
            className="w-full"
            autoSize={{
              maxRows: 6,
              minRows: 4,
            }}
          />
        </Form.Item>

        <div className="inline-block">
          <Form.Item
            name="attachment"
            label="Attachment (optional)"
            className=""
          >
            <Upload
              beforeUpload={(file) => {
                console.log(file);
                return false;
              }}
              maxCount={1}
              accept={Object.values(ALL_MIMES).flat().concat('.png,.jpeg,.jpg,.csv,.doc').join(",")}
            >
              <Button
                variant="outlined"
                className="px-6 py-3"
                htmlType="button"
              >
                Upload attachment
              </Button>
            </Upload>
          </Form.Item>
        </div>

        <div className="flex items-stretch sm:items-center gap-4 mt-4">
          <Button
            htmlType="submit"
            type="primary"
            className="flex-1 sm:flex-grow-0"
            loading={isSubmitting}
          >
            Submit Support Ticket
          </Button>
        </div>
      </Form>
    </>
  );
};
