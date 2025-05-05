import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";
import { getDocumentFoldersQueryKey } from "./useDocumentFolders";

export const useAttachDocumentToFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.attachDocumentToFolder.getTypedRequestBody>
    ) => getAPI().post(API.attachDocumentToFolder, params),
    onSuccess: () => queryClient.invalidateQueries(getDocumentFoldersQueryKey()),
  });
}; 