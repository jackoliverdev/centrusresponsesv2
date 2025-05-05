import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useCreateThreadFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.createThreadFolder.getTypedRequestBody>,
    ) => getAPI().post(API.createThreadFolder, params),
    onSuccess: () => queryClient.invalidateQueries(["thread-folders"]),
  });
};
