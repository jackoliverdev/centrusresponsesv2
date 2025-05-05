import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";
import { getDocumentFoldersQueryKey } from "./useDocumentFolders";

export const useBulkAttachDocumentToFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.bulkAttachDocumentToFolder.getTypedRequestBody>
    ) => getAPI().post(API.bulkAttachDocumentToFolder, params),
    onSuccess: () => queryClient.invalidateQueries(getDocumentFoldersQueryKey()),
  });
}; 