import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";
import { getDocumentFoldersQueryKey } from "./useDocumentFolders";

export const useUpdateDocumentFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.updateDocumentFolder.getTypedRequestBody>,
    ) => getAPI().post(API.updateDocumentFolder, params),
    onSuccess: () => queryClient.invalidateQueries(getDocumentFoldersQueryKey()),
  });
}; 