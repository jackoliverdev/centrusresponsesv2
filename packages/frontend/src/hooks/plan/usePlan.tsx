import { API } from "common";
import { useQuery } from "react-query";
import { getAPI } from "@/utils/api";

/**
 * handles computation for user's current plan and the subscription usages
 */
export const usePlan = () => {
  return useQuery({
    queryKey: ["active-plan"],
    queryFn: async () => {
      const planInfo = await getAPI().post(API.getOrganizationPlan);
      
      console.log("Plan info received:", {
        messageLimit: planInfo?.usageLimits?.messages,
        messageUsage: planInfo?.usages?.messages,
        hasEnough: (planInfo?.usages?.messages ?? 0) < (planInfo?.usageLimits?.messages ?? 0)
      });

      return {
        ...planInfo?.formattedStats,
        name: planInfo?.plan?.name ?? "-",
        currentPlan: planInfo?.plan,
        addon: planInfo?.addon,
        usageLimits: planInfo?.usageLimits,
        usages: planInfo?.usages,
        subscriptionId: planInfo?.subscriptionId,
      };
    },
  });
};
