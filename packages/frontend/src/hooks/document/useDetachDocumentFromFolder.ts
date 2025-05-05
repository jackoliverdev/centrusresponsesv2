import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";
import { getDocumentFoldersQueryKey } from "./useDocumentFolders";

export const useDetachDocumentFromFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.detachDocumentFromFolder.getTypedRequestBody>
    ) => getAPI().post(API.detachDocumentFromFolder, params),
    onSuccess: () => queryClient.invalidateQueries(getDocumentFoldersQueryKey()),
  });
}; 