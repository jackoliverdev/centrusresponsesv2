import { getAPI } from "@/utils/api";
import { API } from "common";
import { useQuery } from "react-query";

export const getHelpContentsQueryKey = (
  params: ReturnType<typeof API.getHelpContents.getTypedRequestBody>,
) => ["help-center-contents", params];

export const useHelpContents = (
  params: ReturnType<typeof API.getHelpContents.getTypedRequestBody>,
) => {
  return useQuery({
    queryKey: getHelpContentsQueryKey(params),
    queryFn: async () => {
      return getAPI().post(API.getHelpContents, params);
    },
    refetchOnWindowFocus: false,
  });
};
