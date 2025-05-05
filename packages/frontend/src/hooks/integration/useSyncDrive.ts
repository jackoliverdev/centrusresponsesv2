import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { getDocumentsQueryKey } from '../documents/useDocuments';
import { message } from 'antd';

export const useSyncDrive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId }: { folderId: string }) => {
      await getAPI().post(API.driveSync, { folderId });
    },
    onSuccess: () => {
      message.success('Synced');
      queryClient.invalidateQueries(getDocumentsQueryKey());
    },
    onError: () => void message.error('Failed to sync drive'),
  });
};
