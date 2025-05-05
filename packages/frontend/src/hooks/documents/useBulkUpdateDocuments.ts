import { getAPI } from "@/utils/api";
import { API, RequestBodyType } from "common";
import { useMutation, useQueryClient } from "react-query";
import { getDocumentsQueryKey } from "./useDocuments";
import { message } from "antd";

export const useBulkUpdateDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: RequestBodyType<typeof API.bulkUpdateDocument>,
    ) => {
      return getAPI().post(API.bulkUpdateDocument, params);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(getDocumentsQueryKey());
      message.success("Documents updated");
    },
    onError: async () => {
      message.error("Failed to update documents");
    },
  });
};
