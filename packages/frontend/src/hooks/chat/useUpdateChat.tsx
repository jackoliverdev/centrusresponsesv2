import { getAPI } from '@/utils/api';
import { API, UpdateChatDto } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { getChatsQueryKey } from './useChats';

export const useUpdateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { id: string; data: UpdateChatDto }) => {
      return await getAPI().post(API.updateChat, variables);
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries(getChatsQueryKey());
    },
  });
};
