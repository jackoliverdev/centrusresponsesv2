import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';

export const useChatDraftMessage = (id: string) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['chat', id, 'drafts'], [id]);
  const query = useQuery({
    queryKey,
    initialData: '',
  });

  const setMessage = useCallback(
    (message: string) => {
      queryClient.setQueryData(queryKey, message);
    },
    [queryClient, queryKey],
  );

  return [query.data, setMessage] as const;
};
