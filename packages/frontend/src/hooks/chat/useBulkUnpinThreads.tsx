import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";
import { message } from "antd";

export const useBulkUnpinThreads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { threadIds: string[] }) => {
      const { threadIds } = params;
      
      // Create an array of promises for each thread unpin
      const promises = threadIds.map((threadId) => 
        getAPI().post(API.unpinThread, { threadId })
      );
      
      // Execute all promises in parallel
      return Promise.all(promises);
    },
    onSuccess: (_, { threadIds }) => {
      queryClient.invalidateQueries(["pinned-threads"]);
      message.success(`${threadIds.length} ${threadIds.length === 1 ? 'thread' : 'threads'} unpinned`);
    },
    onError: () => {
      message.error("Failed to unpin threads. Please try again");
    }
  });
}; 