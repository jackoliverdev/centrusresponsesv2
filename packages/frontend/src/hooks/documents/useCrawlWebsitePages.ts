import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { message } from 'antd';
import { getDocumentsQueryKey } from './useDocuments';

export const useCrawlWebsitePages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ urls, name }: { urls: string[]; name: string }) => {
      const response = await getAPI().post(API.crawlWebsitePages, {
        urls,
        name,
      });
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(getDocumentsQueryKey());
      message.success('Website pages crawled successfully');
    },
    onError: () => {
      message.error('Failed to crawl website pages');
    },
  });
}; 