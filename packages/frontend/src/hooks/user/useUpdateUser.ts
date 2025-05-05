import { useAuthContext } from '@/context/AuthContext';
import { uploadUserImage } from '@/storage/user';
import { getAPI } from '@/utils/api';
import { message, notification } from 'antd';
import { API, RequestBodyType } from 'common';
import { useMutation } from 'react-query';

export const useUpdateUser = () => {
  const { refresh } = useAuthContext();
  return useMutation({
    mutationFn: async (
      data: RequestBodyType<typeof API.updateUser> & { newImage?: File },
    ) => {
      if (data.newImage) {
        data.image = await uploadUserImage(data.newImage);
      }
      await getAPI().post(API.updateUser, data);
    },
    onSuccess: () => {
      notification.success({
        message: 'Updated',
      });
      refresh();
    },
    onError: (e) =>
      e instanceof Error
        ? void message.error(e.message)
        : void message.error('Failed to update user'),
  });
};
