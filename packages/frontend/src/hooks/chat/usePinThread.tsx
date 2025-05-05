import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const usePinThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.pinThread.getTypedRequestBody>,
    ) => getAPI().post(API.pinThread, params),
    onSuccess: () => queryClient.invalidateQueries(["pinned-threads"]),
  });
};
