import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { getDocumentsQueryKey } from './useDocuments';
import { message } from 'antd';
import { getDocumentUsageQueryKey } from './useDocumentUsage';
import { mutationErrorHandler } from '@/utils/error';

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await getAPI().post(API.deleteDocument, { id });
    },
    onSuccess: () => {
      message.success('File Deleted');
      queryClient.invalidateQueries(getDocumentsQueryKey());
      queryClient.invalidateQueries(getDocumentUsageQueryKey());
    },
    onError: mutationErrorHandler,
  });
};
