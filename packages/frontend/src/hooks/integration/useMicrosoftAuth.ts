import { getAPI } from '@/utils/api';
import { message } from 'antd';
import { API } from 'common';
import { useMutation } from 'react-query';

export const useMicrosoftAuth = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await getAPI().post(API.microsoftAuth);
      if (!response) throw new Error('Failed to initiate auth');
      window.location.replace(response.url);
    },
    onError: () => void message.error('Failed to initiate auth'),
  });
};
