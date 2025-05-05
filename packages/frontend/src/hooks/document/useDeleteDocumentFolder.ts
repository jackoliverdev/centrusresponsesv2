import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";
import { getDocumentFoldersQueryKey } from "./useDocumentFolders";

export const useDeleteDocumentFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.deleteDocumentFolder.getTypedRequestBody>,
    ) => getAPI().post(API.deleteDocumentFolder, params),
    onSuccess: () => queryClient.invalidateQueries(getDocumentFoldersQueryKey()),
  });
}; 