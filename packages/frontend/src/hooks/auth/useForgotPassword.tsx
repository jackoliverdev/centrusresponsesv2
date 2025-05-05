import { useAuthContext } from '@/context/AuthContext';
import { App } from "antd";
import { useMutation } from 'react-query';

export const useForgotPassword = () => {
  const { notification } = App.useApp();
  const { sendPasswordResetEmail } = useAuthContext();
  return useMutation({
    mutationFn: async (email: string) => {
      await sendPasswordResetEmail(email);
    },
    onError: (e) =>
      notification.error({
        message: e instanceof Error ? e.message : 'Something went wrong',
      }),
  });
};
