import { useAuthContext } from '@/context/AuthContext';
import { notification } from 'antd';
import { useMutation } from 'react-query';

export const useChangePassword = () => {
  const { changePassword } = useAuthContext();
  return useMutation({
    mutationFn: async ({
      oldPassword,
      newPassword,
    }: {
      oldPassword: string;
      newPassword: string;
    }) => {
      await changePassword(oldPassword, newPassword);
    },
    onSuccess: () => notification.success({ message: 'Password changed' }),
    onError: (e) =>
      notification.error({
        message: e instanceof Error ? e.message : 'Something went wrong',
      }),
  });
};
