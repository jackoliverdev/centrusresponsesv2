import { useQuery, UseQueryOptions } from 'react-query';
import { getAPI } from '@/utils/api';
import { API, ChatSchema } from 'common';
import { useMemo } from 'react';

export const getChatQueryKey = (id: string) => ['chats', id];
export const useChat = (
  id: string,
  options?: UseQueryOptions<ChatSchema | undefined>,
) => {
  const queryKey = useMemo(() => getChatQueryKey(id), [id]);
  return useQuery({
    queryKey,
    queryFn: async () => {
      return await getAPI().post(API.getChat, { id });
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export type ChatQueryResult = ReturnType<typeof useChat>['data'];
