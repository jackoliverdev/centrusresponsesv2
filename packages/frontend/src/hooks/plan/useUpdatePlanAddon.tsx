import { API } from "common";
import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { sleep } from "@/utils/sleep";
import { App } from "antd";

export const useUpdatePlanAddon = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationKey: ["addons-payment"],
    mutationFn: async (
      params: ReturnType<
        typeof API.stripeCheckoutPlanAddons.getTypedRequestBody
      >,
    ) => {
      return getAPI().post(API.stripeCheckoutPlanAddons, params);
    },
    onSuccess: async (response) => {
      if (response?.url) {
        message.info("Redirecting to payment gateway", 2);

        sleep(1000).finally(() => {
          location.href = response.url;
        });
      }
      await queryClient.invalidateQueries(["active-plan"]);
    },
  });
};
