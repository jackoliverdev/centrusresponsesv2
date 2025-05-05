import { useMutation } from 'react-query';
import { getAPI } from '@/utils/api';
import { API } from 'common';
import { mutationErrorHandler } from '@/utils/error';

export const useCancelChatMessage = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await getAPI().post(API.cancelChatMessage, { id });
      return;
    },
    onError: mutationErrorHandler,
  });
};
