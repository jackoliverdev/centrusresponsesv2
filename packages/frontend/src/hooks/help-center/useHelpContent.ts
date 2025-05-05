import { getAPI } from "@/utils/api";
import { API } from "common";
import { useQuery } from "react-query";

export const getHelpContentQueryKey = (
  params: ReturnType<typeof API.getHelpContent.getTypedRequestBody>,
) => ["help-center-content", params];

export const useHelpContent = (
  params: ReturnType<typeof API.getHelpContent.getTypedRequestBody>,
) => {
  return useQuery({
    queryKey: getHelpContentQueryKey(params),
    queryFn: async () => {
      return getAPI().post(API.getHelpContent, params);
    },
    refetchOnWindowFocus: false,
  });
};
