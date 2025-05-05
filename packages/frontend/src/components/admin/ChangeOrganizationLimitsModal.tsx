"use client";

import React, { useCallback, useEffect } from "react";

import { FunctionComponent } from "react";
import { Modal, Button, Form, App, InputNumber } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { OrganizationPlanUsage } from "@/components/admin/OrganizationPlanUsage";
import { formatNumber, PlatformOrganizationsSchema } from "common";
import { useUpdateOrganizationLimits } from "@/hooks/admin/useUpdateOrganizationLimits";
import { formatBytes } from "@/utils";

type Props = {
  organization?: PlatformOrganizationsSchema;
  onCancel(success?: boolean): void;
};

const ONE_MB = 1_000_000;

export const ChangeOrganizationLimitsModal: FunctionComponent<Props> = ({
  organization,
  onCancel,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<{
    messages: number;
    storage: number;
    users: number;
    id: number;
  }>();
  const addonValues = Form.useWatch([], form);

  const { isLoading, mutate: updateAddons } = useUpdateOrganizationLimits();

  const handleSubmit = useCallback(async () => {
    if (!organization) {
      return;
    }

    updateAddons(
      {
        values: {
          messages: addonValues.messages,
          storage: addonValues.storage * ONE_MB,
          users: addonValues.users,
        },
        organizationId: addonValues.id,
      },
      {
        onSuccess() {
          message.success("Usage limits updated successfully.");
          onCancel(true);
        },
        onError() {
          message.error("Failed to update Usage limits.");
        },
      },
    );
  }, [organization, updateAddons, addonValues, message, onCancel]);

  useEffect(() => {
    if (!organization) {
      form.resetFields();
    } else {
      const messages =
        organization.usageLimits.messages -
        (organization.addon?.extraMessages ?? 0);

      const storage =
        (organization.usageLimits.storage -
          (organization.addon?.extraStorage ?? 0)) /
        ONE_MB;

      const users =
        organization.usageLimits.users - (organization.addon?.extraUsers ?? 0);

      form.setFieldsValue({
        messages,
        storage,
        users,
        id: organization.id,
      });
    }
  }, [form, organization]);

  return (
    <Modal
      open={!!organization}
      centered
      width={720}
      footer={null}
      title={<h2 className="text-xl font-bold">Update Plan Limits</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      onCancel={() => onCancel()}
      closable={!isLoading}
      maskClosable={!isLoading}
      keyboard={!isLoading}
    >
      {organization && (
        <>
          <div className="w-full pt-3 pb-6">
            <div className="w-full flex flex-col gap-y-4">
              <OrganizationPlanUsage organization={organization} />
            </div>
          </div>
          <div className="flex flex-row items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">New Limits</h3>
          </div>

          <Form
            form={form}
            layout="vertical"
            disabled={isLoading}
            onFinish={handleSubmit}
          >
            <Form.Item name="id" initialValue={organization.id} noStyle />

            <div className="flex sm:gap-4 flex-col sm:flex-row">
              <Form.Item
                name="messages"
                label="Monthly Message Limit"
                className="w-full"
                rules={[
                  {
                    type: "number",
                    required: true,
                    message: "Required",
                  },
                  {
                    type: "number",
                    min: organization.plan.messageLimit,
                    message: "Minimum exceeded",
                  },
                ]}
                help={
                  <span className="flex justify-end pl-3">
                    <span className="text-sm">
                      min messages per month:{" "}
                      {formatNumber(organization.plan.messageLimit, {
                        useGrouping: true,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </span>
                }
              >
                <InputNumber
                  size="large"
                  className="w-full"
                  step={50}
                  min={organization.plan.messageLimit}
                  formatter={(value) => formatNumber(value)}
                  parser={(value) =>
                    value?.replace(/\D/g, "") as unknown as number
                  }
                />
              </Form.Item>

              <Form.Item
                name="storage"
                label="Storage Limit (MB)"
                className="w-full"
                rules={[
                  {
                    type: "number",
                    required: true,
                    message: "Required",
                  },
                  {
                    type: "number",
                    min: organization.plan.storageLimit / ONE_MB,
                    message: "Minimum exceeded",
                  },
                ]}
                help={
                  <span className="flex justify-between gap-3 pl-3">
                    <span className="text-sm">
                      {formatBytes((addonValues.storage ?? 0) * ONE_MB)}
                    </span>
                    <span className="text-sm">
                      min: {formatBytes(organization.plan.storageLimit)}
                    </span>
                  </span>
                }
              >
                <InputNumber
                  size="large"
                  className="w-full"
                  step={100}
                  min={organization.plan.storageLimit / ONE_MB}
                  formatter={(value) => formatNumber(value)}
                  parser={(value) =>
                    value?.replace(/\D/g, "") as unknown as number
                  }
                />
              </Form.Item>

              <Form.Item
                name="users"
                label="User Limit"
                className="w-full"
                rules={[
                  {
                    type: "number",
                    required: true,
                    message: "Required",
                  },
                  {
                    type: "number",
                    min: organization.plan.userLimit,
                    message: "Minimum exceeded",
                  },
                ]}
                help={
                  <span className="flex justify-end pl-3">
                    <span className="text-sm">
                      min:{" "}
                      {formatNumber(organization.plan.userLimit, {
                        useGrouping: true,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </span>
                }
              >
                <InputNumber
                  size="large"
                  className="w-full"
                  step={1}
                  min={organization.plan.userLimit}
                  formatter={(value) => formatNumber(value)}
                  parser={(value) =>
                    value?.replace(/\D/g, "") as unknown as number
                  }
                />
              </Form.Item>
            </div>

            <div className="flex justify-end flex-wrap-reverse items-stretch sm:items-center gap-4 mt-4">
              <Button
                className="flex-1 sm:flex-grow-0"
                disabled={isLoading}
                onClick={() => onCancel()}
              >
                Cancel
              </Button>
              <Button
                htmlType="submit"
                type="primary"
                className="flex-1 sm:flex-grow-0"
                disabled={!form.isFieldsTouched()}
                loading={isLoading}
              >
                Update Limits
              </Button>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};
