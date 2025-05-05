import { getAPI } from '@/utils/api';
import { message } from 'antd';
import { API, RequestBodyType } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { getDocumentsQueryKey } from './useDocuments';

export const useUpdateDocumentMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: RequestBodyType<typeof API.updateDocumentMetadata>,
    ) => {
      await getAPI().post(API.updateDocumentMetadata, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(getDocumentsQueryKey());
      message.success('Updated');
    },
    onError: () => void message.error('Failed to update'),
  });
};
