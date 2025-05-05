import React, {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { App, Button, Card, Form, Input } from "antd";
import { HardDrive, MessageCircle, Users } from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  PlanAddonSchema,
  PlanSchema,
} from "common";
import { formatBytes } from "@/utils";
import { useUpdatePlanAddon } from "@/hooks/plan/useUpdatePlanAddon";

type Props = {
  addon: PlanAddonSchema;
  extraMessagesPlan?: PlanSchema;
  extraStoragePlan?: PlanSchema;
  extraUsersPlan?: PlanSchema;
  isLoading?: boolean;
};

type AddonFormData = PlanAddonSchema & {
  extraMessagesPretty: string;
  extraStoragePretty: string;
  extraUsersPretty: string;
  isLoading?: boolean;
};

export const PlanAddons: FunctionComponent<PropsWithChildren<Props>> = ({
  addon,
  extraStoragePlan,
  extraMessagesPlan,
  extraUsersPlan,
  isLoading,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<AddonFormData>();
  const addonValues = Form.useWatch([], form);
  const [isTouched, setIsTouched] = useState(false);

  const { mutateAsync: mutateAddons, isLoading: isLoadingAddons } =
    useUpdatePlanAddon();

  const addonTypes = useMemo(
    () => [
      {
        name: extraMessagesPlan?.name ?? "",
        icon: <MessageCircle className="h-4 w-4" />,
        description: `${formatCurrency(extraMessagesPlan?.price ?? 0)} per ${formatNumber(extraMessagesPlan?.unitSize ?? 0, { useGrouping: true })} messages`,
        prettyValue: formatNumber(addon?.extraMessages ?? 0, {
          useGrouping: true,
        }),
        factor: extraMessagesPlan?.unitSize ?? 0,
        key: "extraMessages" as const,
      },
      {
        name: extraStoragePlan?.name ?? "",
        icon: <HardDrive className="h-4 w-4" />,
        description: `${formatCurrency(extraStoragePlan?.price ?? 0)} per GB`,
        prettyValue: formatBytes(addon?.extraStorage ?? 0),
        factor: extraStoragePlan?.unitSize ?? 0,
        key: "extraStorage" as const,
      },
      {
        name: extraUsersPlan?.name ?? "",
        icon: <Users className="h-4 w-4" />,
        description: `${formatCurrency(extraUsersPlan?.price ?? 0)} per user`,
        prettyValue: formatNumber(addon?.extraUsers ?? 0, {
          useGrouping: true,
        }),
        factor: extraUsersPlan?.unitSize ?? 0,
        key: "extraUsers" as const,
      },
    ],
    [addon, extraMessagesPlan, extraStoragePlan, extraUsersPlan],
  );

  const onUpdateAddons = useCallback(async () => {
    try {
      message.info("Processing addons", 3);
      await mutateAddons({
        quantities: {
          users: form.getFieldValue("extraUsers"),
          messages: form.getFieldValue("extraMessages"),
          storage: form.getFieldValue("extraStorage"),
        },
      });
      form.resetFields();
    } catch (e) {
      message.error("Add-on update failed");
    }
  }, [form, message, mutateAddons]);

  const handleUpdateAddonValue = useCallback(
    (value: number, key: keyof PlanAddonSchema) => {
      const newValue = Math.max(form.getFieldValue(key) + value, 0);
      form.setFieldValue(key, newValue);
      switch (key) {
        case "extraMessages":
          form.setFieldValue(
            "extraMessagesPretty",
            formatNumber(newValue, { useGrouping: true }),
          );
          break;
        case "extraStorage":
          form.setFieldValue("extraStoragePretty", formatBytes(newValue));
          break;
        case "extraUsers":
          form.setFieldValue(
            "extraUsersPretty",
            formatNumber(newValue, { useGrouping: true }),
          );
          break;
      }
    },
    [form],
  );

  useEffect(() => {
    setIsTouched(
      !!(
        addonValues?.extraMessages ||
        addonValues?.extraStorage ||
        addonValues?.extraUsers
      ),
    );
  }, [addonValues, form]);

  return (
    <Card loading={isLoading}>
      <div className="flex flex-row items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Add-ons</h2>
          <p className="text-muted-foreground">
            Extend your plan with additional resources
          </p>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        disabled={isLoadingAddons}
        onFinish={onUpdateAddons}
      >
        <Form.Item name="id" initialValue={addon.id} noStyle />
        <Form.Item name="extraMessages" initialValue={0} noStyle />
        <Form.Item name="extraStorage" initialValue={0} noStyle />
        <Form.Item name="extraUsers" initialValue={0} noStyle />

        <div className="grid gap-4 md:grid-cols-3">
          {addonTypes.map((addonType, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 items-stretch justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {addonType.icon}{" "}
                  <span className="font-medium">{addonType.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {addonType.description}
                </div>
              </div>
              <div className="flex items-center w-full gap-1">
                <Button
                  size="middle"
                  variant="outlined"
                  disabled={
                    isLoadingAddons ||
                    !addonValues ||
                    addonValues[addonType.key] === 0
                  }
                  onClick={() =>
                    handleUpdateAddonValue(-addonType.factor, addonType.key)
                  }
                >
                  -
                </Button>
                <Form.Item
                  name={`${addonType.key}Pretty`}
                  label=""
                  className="w-full"
                  initialValue={0}
                  noStyle
                >
                  <Input
                    size="large"
                    min={0}
                    className="w-full"
                    disabled
                    readOnly
                  />
                </Form.Item>
                <Button
                  size="middle"
                  variant="outlined"
                  disabled={isLoadingAddons}
                  onClick={() =>
                    handleUpdateAddonValue(addonType.factor, addonType.key)
                  }
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end mt-4">
          <Button
            htmlType="submit"
            size="large"
            type="primary"
            disabled={!isTouched}
            loading={isLoadingAddons}
          >
            Update add-ons
          </Button>
        </div>
      </Form>
    </Card>
  );
};
