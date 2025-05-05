import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useReorderThreadPin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.reorderPinedThread.getTypedRequestBody>,
    ) => getAPI().post(API.reorderPinedThread, params),
    onSuccess: () => queryClient.invalidateQueries(["pinned-threads"]),
  });
};
