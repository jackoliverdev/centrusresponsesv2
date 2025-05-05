import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useDetachThreadFromFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.detachThreadFromFolder.getTypedRequestBody>,
    ) => getAPI().post(API.detachThreadFromFolder, params),
    onSuccess: () => queryClient.invalidateQueries(["thread-folders"]),
  });
};
