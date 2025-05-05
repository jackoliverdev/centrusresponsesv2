import { useQuery } from 'react-query';

export const getIsStreamingMessageQueryKey = (id: string) => [
  'chats',
  id,
  'streaming',
];
export const useStreamingMessage = (id: string) => {
  return useQuery({
    queryKey: getIsStreamingMessageQueryKey(id),
  });
};
