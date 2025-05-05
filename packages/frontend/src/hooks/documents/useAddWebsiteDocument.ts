import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { getDocumentsQueryKey } from './useDocuments';
import { message } from 'antd';

export const useAddWebsiteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url }: { url: string }) => {
      await getAPI().post(API.addDocument, {
        url,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(getDocumentsQueryKey());
      message.success('Website scraped');
    },
    onError: () => {
      message.error('Failed to scrape website');
    },
  });
};
