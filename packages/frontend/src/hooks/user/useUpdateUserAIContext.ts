import { useMutation, useQueryClient } from 'react-query';
import { API } from 'common';
import { getAPI } from '@/utils/api';
import { mutationErrorHandler } from '@/utils/error';
import { message } from 'antd';

export const useUpdateUserAIContext = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (aiUserContext: string) => {
      return getAPI().post(API.updateUserAIContext, {
        ai_user_context: aiUserContext
      });
    },
    {
      onSuccess: () => {
        message.success('Your AI context has been updated successfully.');
        queryClient.invalidateQueries('user');
      },
      onError: (error) => {
        mutationErrorHandler(error);
        message.error('Failed to update your AI context. Please try again.');
      },
    }
  );
}; 