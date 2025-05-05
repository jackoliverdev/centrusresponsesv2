import React, { FunctionComponent, useMemo } from "react";
import { Button, Card } from "antd";
import { Check, HardDrive, MessageCircle, Users, X } from "lucide-react";
import classNames from "classnames";
import {
  Duration,
  PlanSchema,
  formatCurrency,
  formatNumber,
} from "common";
import { formatBytes } from "@/utils";

type Props = {
  plan: PlanSchema;
  duration: Duration;
  currentPlan?: PlanSchema;
  isEnterprise?: boolean;
  onClick(plan: PlanSchema, isEnterprise?: boolean): void;
};

export const PlanExtraFeatures: FunctionComponent<{
  plan: Props["plan"];
  className?: string;
}> = ({ plan, className }) => {
  return (
    <div className={classNames(className, "space-y-2")}>
      <div className="flex items-center gap-2">
        {plan.addons ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-gray-300" />
        )}
        Add-ons available
      </div>
      <div className="flex items-center gap-2">
        {plan.prioritySupport ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-gray-300" />
        )}
        Priority support
      </div>
      <div className="flex items-center gap-2">
        {plan.customIntegrations ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-gray-300" />
        )}
        Custom integrations
      </div>
    </div>
  );
};

export const Plan: FunctionComponent<Props> = ({
  plan,
  duration,
  currentPlan,
  isEnterprise,
  onClick,
}) => {
  const isCurrentPlan = useMemo(
    () => plan.id === currentPlan?.id,
    [plan, currentPlan],
  );

  return (
    <Card
      key={plan.id}
      className={classNames({
        "border-primary": isCurrentPlan,
      })}
      classNames={{ body: "flex flex-col gap-2 sm:gap-4 !px-3 !py-1 sm:!px-4 sm:!py-2" }}
    >
      <div>
        <h3 className="text-lg font-bold">{plan.name}</h3>
        {isEnterprise ? (
          <span className="text-muted-foreground">Custom Pricing</span>
        ) : (
          <span className="text-muted-foreground">
            {formatCurrency(plan.price)} /month
          </span>
        )}
        {duration === "annually" &&
          (isEnterprise ? (
            <div className="text-emerald-500">Discounted billing</div>
          ) : (
            <div className="text-emerald-500">Billed annually</div>
          ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>
            {plan.messageLimit === -1
              ? "Unlimited messages"
              : `${formatNumber(plan.messageLimit)} messages`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          <span>{formatBytes(plan.storageLimit)} storage</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>
            {plan.userLimit === -1
              ? "Unlimited users"
              : `${plan.userLimit} users`}
          </span>
        </div>
      </div>

      <hr className="w-full" />

      <PlanExtraFeatures plan={plan} />

      <Button
        type="primary"
        disabled={isCurrentPlan}
        onClick={() => onClick(plan, isEnterprise)}
      >
        {isCurrentPlan
          ? "Current Plan"
          : isEnterprise
            ? "Contact Sales"
            : "Change Plan"}
      </Button>
    </Card>
  );
};
