import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useQuery } from 'react-query';

export const getChatsQueryKey = () => 'chats';
export const getChats = async () => {
  return await getAPI().post(API.getChats);
};
export type ChatsQueryResult = Awaited<ReturnType<typeof getChats>>;
export const useChats = () => {
  return useQuery({
    queryKey: [getChatsQueryKey()],
    queryFn: getChats,
  });
};
