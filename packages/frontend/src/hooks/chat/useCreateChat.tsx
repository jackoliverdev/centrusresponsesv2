import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { ChatsQueryResult, getChatsQueryKey } from './useChats';
import { mutationErrorHandler } from '@/utils/error';

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { tag: string }) => {
      const res = await getAPI().post(API.createChat, data);
      if (res == undefined) throw new Error('Failed to create chat');
      return res;
    },
    onSuccess: (response) =>
      void queryClient.setQueryData<ChatsQueryResult>(
        [getChatsQueryKey()],
        (chats = []) => [response, ...chats],
      ),
    onError: mutationErrorHandler,
  });
};
