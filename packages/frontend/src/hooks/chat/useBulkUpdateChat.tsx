import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API, UpdateChatDto } from "common";
import { message } from "antd";
import { getChatsQueryKey } from "./useChats";

export const useBulkUpdateChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { ids: string[]; data: UpdateChatDto }) => {
      const { ids, data } = params;
      
      // Create an array of promises for each chat update
      const promises = ids.map((id) => 
        getAPI().post(API.updateChat, { id, data })
      );
      
      // Execute all promises in parallel
      return Promise.all(promises);
    },
    onSuccess: (_, { data, ids }) => {
      queryClient.invalidateQueries(getChatsQueryKey());
      
      if (data.archived !== undefined) {
        message.success(data.archived 
          ? `${ids.length} ${ids.length === 1 ? 'thread' : 'threads'} archived` 
          : `${ids.length} ${ids.length === 1 ? 'thread' : 'threads'} unarchived`
        );
      } else {
        message.success(`${ids.length} ${ids.length === 1 ? 'thread' : 'threads'} updated`);
      }
    },
    onError: () => {
      message.error("Failed to update threads. Please try again");
    }
  });
}; 