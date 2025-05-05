import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { getDocumentsQueryKey } from '../documents/useDocuments';
import { message } from 'antd';

export const useSyncTeams = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { channelId: string; teamId: string }[]) => {
      await getAPI().post(API.teamsSync, data);
    },
    onSuccess: () => {
      message.success('Synced');
      queryClient.invalidateQueries(getDocumentsQueryKey());
    },
    onError: () => void message.error('Failed to sync teams'),
  });
};
