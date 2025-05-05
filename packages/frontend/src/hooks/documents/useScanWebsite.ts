import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation } from 'react-query';
import { message } from 'antd';

export const useScanWebsite = () => {
  return useMutation({
    mutationFn: async ({ url }: { url: string }) => {
      const response = await getAPI().post(API.scanWebsite, {
        url,
      });
      return response;
    },
    onError: () => {
      message.error('Failed to scan website');
    },
  });
}; 