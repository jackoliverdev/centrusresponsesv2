import { getAPI } from "@/utils/api";
import { API, RequestBodyType } from "common";
import { useMutation, useQueryClient } from "react-query";
import { getDocumentsQueryKey } from "./useDocuments";
import { message } from "antd";

export const useBulkDeleteDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: RequestBodyType<typeof API.bulkDeleteDocument>,
    ) => {
      await getAPI().post(API.bulkDeleteDocument, params);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(getDocumentsQueryKey());
      message.success("Documents deleted");
    },
    onError: () => {
      message.error("Failed to delete documents");
    },
  });
};
