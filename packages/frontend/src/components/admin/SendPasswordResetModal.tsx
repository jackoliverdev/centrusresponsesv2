"use client";

import React, { useCallback } from "react";

import { FunctionComponent } from "react";
import { Modal, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { usePasswordResetEmail } from "@/hooks/admin/usePasswordResetEmail";

type Props = {
  email?: string;
  onCancel(): void;
};

export const SendPasswordResetModal: FunctionComponent<Props> = ({
  email,
  onCancel,
}) => {
  const { mutateAsync: sendResetEmail, isLoading } = usePasswordResetEmail();

  const handleSubmit = useCallback(async () => {
    if (!email) {
      return;
    }
    try {
      await sendResetEmail(email);
      onCancel();
    } catch (e) {}
  }, [email, onCancel, sendResetEmail]);

  return (
    <Modal
      open={!!email}
      centered
      width={450}
      footer={
        <div className="flex justify-end gap-4">
          <Button disabled={isLoading} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={isLoading} onClick={handleSubmit}>
            Send Reset Email
          </Button>
        </div>
      }
      title={<h2 className="text-xl font-bold">Reset Password</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      onCancel={onCancel}
      closable={!isLoading}
      maskClosable={!isLoading}
      keyboard={!isLoading}
    >
      {email && (
        <div className="w-full pt-3 pb-6">
          <div className="w-full flex flex-col gap-y-4">
            <p className="text-base text-grey-medium">
              Are you sure you want to send a password reset email to {" "}
              <span className="font-bold">{email}</span>?
            </p>
            <p className="text-base text-grey-medium">
              They will receive an email with instructions to reset their
              password.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
