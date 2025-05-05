import { API, ChangePlanDto } from "common";
import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { sleep } from "@/utils/sleep";
import { App } from "antd";

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationKey: ["plan-update"],
    mutationFn: async (values: ChangePlanDto) => {
      const response = await getAPI().post(API.stripeCheckoutPlan, values);

      if (response?.url) {
        message.info("Redirecting to payment gateway", 2);

        sleep(1000).finally(() => {
          location.href = response.url;
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(["active-plan"]);
    },
  });
};
