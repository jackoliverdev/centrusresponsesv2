import { getAPI } from "@/utils/api";
import { API, RequestBodyType } from "common";
import { useMutation } from "react-query";

export const useUpdateOrganizationLimits = () => {
  return useMutation({
    mutationFn: async (
      organization: RequestBodyType<typeof API.updateLimitsForOrganization>,
    ) => {
      await getAPI().post(API.updateLimitsForOrganization, organization);
    },
  });
};
