import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useDeleteThreadFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.deleteThreadFolder.getTypedRequestBody>,
    ) => getAPI().post(API.deleteThreadFolder, params),
    onSuccess: () => queryClient.invalidateQueries(["thread-folders"]),
  });
};
