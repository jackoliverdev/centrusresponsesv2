import { message } from 'antd';
import { AxiosError } from 'axios';

export const mutationErrorHandler = (error: unknown) => {
  if (error instanceof AxiosError) return void message.error(error.message);
  if (error instanceof Error) return void message.error(error.message);
  return void message.error('Something went wrong');
};
