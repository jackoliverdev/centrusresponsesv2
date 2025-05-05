import { API } from "common";
import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { App } from "antd";

export const useSwitchToFreePlan = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationKey: ["plan-update-to-free"],
    mutationFn: async (currentSubscriptionId: string) => {
      return getAPI().post(API.stripeCancelSubscription, { currentSubscriptionId })
    },
    onSuccess: async () => {
      message.success(`Successfully changed to Free plan`)
      await queryClient.invalidateQueries(["active-plan"]);
    },
  });
};
