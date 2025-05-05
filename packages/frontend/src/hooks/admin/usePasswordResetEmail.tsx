import { useMutation, useQueryClient } from "react-query";
import { App } from "antd";
import { useAuthContext } from '@/context/AuthContext';

export const usePasswordResetEmail = () => {
  const queryClient = useQueryClient();
  const { sendPasswordResetEmail } = useAuthContext();
  const { notification } = App.useApp();

  return useMutation({
    mutationKey: ["send-password-reset-email"],
    mutationFn: async (email: string) => {
      await sendPasswordResetEmail(email);
    },
    onSuccess: async () => {
      notification.success({
        message: 'Success',
        description: 'Password reset email sent'
      });
    },
    onError: async () => {
      notification.error({
        message: 'Error',
        description: 'Failed to send password reset email'
      });
      queryClient.invalidateQueries(["users"]).catch();
    },
  });
};
