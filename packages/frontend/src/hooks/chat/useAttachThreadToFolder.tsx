import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useAttachThreadToFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.attachThreadToFolder.getTypedRequestBody>,
    ) => getAPI().post(API.attachThreadToFolder, params),
    onSuccess: () => queryClient.invalidateQueries(["thread-folders"]),
  });
};
