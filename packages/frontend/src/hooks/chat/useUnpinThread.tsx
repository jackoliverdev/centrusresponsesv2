import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useUnpinThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.unpinThread.getTypedRequestBody>,
    ) => getAPI().post(API.unpinThread, params),
    onSuccess: () => queryClient.invalidateQueries(["pinned-threads"]),
  });
};
