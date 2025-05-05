import { useAuthContext } from '@/context/AuthContext';
import { message } from 'antd';
import { useMutation } from 'react-query';
import { SignInDto } from 'common';

export const useSignInWithEmailAndPassword = () => {
  const { signInWithEmailAndPassword } = useAuthContext();
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: SignInDto) => {
      await signInWithEmailAndPassword(email, password);
    },
    onError: () => void message.error('Invalid Email/Password'),
  });
};
