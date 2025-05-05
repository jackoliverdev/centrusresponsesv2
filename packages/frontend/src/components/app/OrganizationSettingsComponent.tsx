import React, { FunctionComponent, PropsWithChildren } from "react";
import { useOrganization } from "@/hooks/admin/useOrganization";
import { Card, Form, Input, Button } from "antd";
import { PlanExtraFeatures } from "@/components/app/Plan";
import { PlanUsage } from "@/components/app/PlanUsage";
import { usePlan } from "@/hooks/plan/usePlan";
import { ChevronRight, CreditCard } from "lucide-react";
import { useRouter } from "next/router";

type Props = object;

export const OrganizationSettingsComponent: FunctionComponent<
  PropsWithChildren<Props>
> = () => {
  const router = useRouter();
  const { data: { id, name } = { id: "Loading...", name: "" } } =
    useOrganization();
  const { data } = usePlan();

  const { currentPlan: plan } = data || {};

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <h2 className="text-2xl font-bold">Organisation settings</h2>
          <Button
            variant="outlined"
            color="primary"
            className="flex items-center gap-2"
            icon={<CreditCard className="h-4 w-4" />}
            onClick={() => router.push("/app/settings/billing")}
          >
            Manage Billing
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Card>
          <div className="flex flex-row items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Basic Information</h3>
          </div>
          <Form disabled layout="vertical">
            <Form.Item label="Organisation ID">
              <Input value={id} readOnly disabled />
            </Form.Item>
            <Form.Item label="Organisation Name" style={{ marginBottom: "0" }}>
              <Input value={name} readOnly disabled />
            </Form.Item>
          </Form>
        </Card>

        <PlanUsage>
          {plan && <PlanExtraFeatures className="mt-4" plan={plan} />}
          <div className="flex justify-end items-center mt-4">
            <Button
              variant="outlined"
              color="primary"
              className="flex items-center gap-2"
              icon={<ChevronRight className="h-4 w-4" />}
              iconPosition="end"
              onClick={() => router.push("/app/settings/billing")}
            >
              View Plan Options
            </Button>
          </div>
        </PlanUsage>
      </div>
    </>
  );
};
