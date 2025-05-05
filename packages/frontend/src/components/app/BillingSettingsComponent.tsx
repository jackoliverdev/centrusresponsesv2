import React, {
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Badge, Button, Card, Segmented, Modal, App } from "antd";
import { Plan } from "@/components/app/Plan";
import { formatCurrency, formatPercent, Duration, PlanSchema } from "common";
import { usePlan } from "@/hooks/plan/usePlan";
import { PlanUsage } from "@/components/app/PlanUsage";
import { CloseOutlined } from "@ant-design/icons";
import { AlertCircle } from "lucide-react";
import { PlanAddons } from "@/components/app/PlanAddons";
import { usePlans } from "@/hooks/plan/usePlans";
import { useUpdatePlan } from "@/hooks/plan/useUpdatePlan";
import { useSwitchToFreePlan } from "@/hooks/plan/useSwitchToFreePlan";
import { EnterprisePlanModal } from "@/components/app/EnterprisePlanModal";

type Props = object;

export const BillingSettingsComponent: FunctionComponent<
  PropsWithChildren<Props>
> = () => {
  const { message } = App.useApp();

  const { data: planData, isLoading } = usePlan();
  const { currentPlan, addon } = planData || {};
  const { data: plans = [], isLoading: isLoadingPlans } = usePlans();
  const [duration, setDuration] = useState<Duration>("annually");
  const [changePlanTo, setChangePlanTo] = useState<PlanSchema>();
  const [showEnterpriseForm, setShowEnterpriseForm] = useState(false);

  const { mutateAsync: mutatePlan, isLoading: isLoadingPlanChange } =
    useUpdatePlan();

  const { mutateAsync: mutateToFreePlan, isLoading: isLoadingFreePlanChange } =
    useSwitchToFreePlan();

  const freePlan = useMemo(
    () => plans?.find(({ slug }) => slug === "free"),
    [plans],
  );

  const enterprisePlan = useMemo(
    () => plans?.find(({ slug }) => slug === "enterprise"),
    [plans],
  );

  const extraMessagesPlan = useMemo(
    () => plans?.find(({ slug }) => slug === "addon_messages"),
    [plans],
  );

  const extraStoragePlan = useMemo(
    () => plans?.find(({ slug }) => slug === "addon_storage"),
    [plans],
  );

  const extraUsersPlan = useMemo(
    () => plans?.find(({ slug }) => slug === "addon_users"),
    [plans],
  );

  const subscribablePlans = useMemo(
    () =>
      plans?.filter(
        ({ slug, duration: planDuration }) =>
          [
            "small_team_monthly",
            "small_team_annually",
            "large_team_monthly",
            "large_team_annually",
          ].includes(slug) && planDuration === duration,
      ) ?? [],
    [duration, plans],
  );

  const showChangePlanModal = useCallback((plan: PlanSchema) => {
    setChangePlanTo(plan);
  }, []);

  const onCancelChangePlan = useCallback(() => {
    setChangePlanTo(undefined);
  }, []);

  const onChangePlan = useCallback(async () => {
    if (!changePlanTo?.id || !planData) {
      return;
    }

    try {
      if (changePlanTo.id === freePlan?.id) {
        await mutateToFreePlan(planData.subscriptionId ?? "");
      } else {
        await mutatePlan({ newPlanId: changePlanTo.id });
      }
      setChangePlanTo(undefined);
    } catch (e) {
      message.error("Plan change failed");
    }
  }, [
    changePlanTo?.id,
    freePlan?.id,
    message,
    mutatePlan,
    mutateToFreePlan,
    planData,
  ]);

  useEffect(() => {
    if (currentPlan?.duration && currentPlan.duration !== "discounted") {
      setDuration(currentPlan.duration);
    }
  }, [currentPlan?.duration]);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Billing settings</h2>
          <p className="text-muted-foreground">
            Manage your plan and billing details
          </p>
        </div>

        {/* Current Plan Section */}
        <PlanUsage />

        {/* Available Plans Section */}
        <Card loading={isLoadingPlans && !plans?.length}>
          <div className="flex flex-wrap items-center justify-between mb-4 gap-y-6 gap-x-4">
            <div>
              <h2 className="text-2xl font-bold">Available Plans</h2>
              <p className="text-muted-foreground">
                Choose the plan that best fits your needs
              </p>
            </div>
            <Badge
              count={duration === "monthly" ? 0 : `save ${formatPercent(0.25)}`}
              style={{ backgroundColor: "#10b981" }}
              offset={["-110%", -5]}
            >
              <Segmented<Duration>
                size="large"
                type=""
                value={duration}
                options={[
                  {
                    label: "Annual",
                    value: "annually",
                  },
                  {
                    label: "Monthly",
                    value: "monthly",
                  },
                ]}
                onChange={(value) => setDuration(value)}
              />
            </Badge>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {freePlan && (
              <Plan
                plan={freePlan}
                currentPlan={currentPlan}
                duration={duration}
                onClick={showChangePlanModal}
              />
            )}
            {subscribablePlans.map((plan) => {
              return (
                <Plan
                  key={plan.id}
                  plan={plan}
                  currentPlan={currentPlan}
                  duration={duration}
                  onClick={showChangePlanModal}
                />
              );
            })}
            {enterprisePlan && (
              <Plan
                plan={enterprisePlan}
                currentPlan={currentPlan}
                duration={duration}
                isEnterprise
                onClick={() => setShowEnterpriseForm(true)}
              />
            )}
          </div>
        </Card>

        {/* Addons Section */}
        {addon && currentPlan?.addons && (
          <PlanAddons
            addon={addon}
            extraMessagesPlan={extraMessagesPlan}
            extraStoragePlan={extraStoragePlan}
            extraUsersPlan={extraUsersPlan}
            isLoading={isLoading}
          />
        )}
      </div>

      <Modal
        open={!!changePlanTo}
        centered
        width={450}
        footer={
          <div className="flex justify-end gap-4">
            <Button
              disabled={isLoadingPlanChange || isLoadingFreePlanChange}
              onClick={onCancelChangePlan}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={isLoadingPlanChange || isLoadingFreePlanChange}
              onClick={onChangePlan}
            >
              Confirm Change
            </Button>
          </div>
        }
        title={<h2 className="text-xl font-bold">Confirm Plan Change</h2>}
        closeIcon={<CloseOutlined className="text-grey-dark" />}
        className="rounded-xl shadow-card-shadow"
        onCancel={onCancelChangePlan}
        closable={!isLoadingPlanChange || !isLoadingFreePlanChange}
        maskClosable={!isLoadingPlanChange || !isLoadingFreePlanChange}
        keyboard={!isLoadingPlanChange || !isLoadingFreePlanChange}
      >
        {changePlanTo && (
          <div className="w-full pt-3 pb-6">
            <div className="w-full flex flex-col gap-y-4">
              <p className="text-base text-grey-medium">
                Are you sure you want to change to the {changePlanTo.name} plan?
              </p>
              <p>Price: {formatCurrency(changePlanTo.price)} /month</p>
              <p>{`(Billed ${duration})`}</p>
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                <span>Your billing will be adjusted immediately</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <EnterprisePlanModal
        open={showEnterpriseForm}
        onClose={() => setShowEnterpriseForm(false)}
      />
    </>
  );
};
