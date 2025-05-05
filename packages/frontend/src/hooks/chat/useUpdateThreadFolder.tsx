import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useUpdateThreadFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.updateThreadFolder.getTypedRequestBody>,
    ) => getAPI().post(API.updateThreadFolder, params),
    onSuccess: () => queryClient.invalidateQueries(["thread-folders"]),
  });
};
