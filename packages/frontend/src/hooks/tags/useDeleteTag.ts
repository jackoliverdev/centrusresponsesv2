import { getAPI } from "@/utils/api";
import { API } from "common";
import { useMutation } from "react-query";
import { App } from 'antd';
import { mutationErrorHandler } from '@/utils/error';

export const useDeleteTag = () => {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (
      params: ReturnType<typeof API.deleteTag.getTypedRequestBody>,
    ) => {
      return getAPI().post(API.deleteTag, params);
    },
    onSuccess: () => void message.success("Tag deleted successfully."),
    onError: mutationErrorHandler,
  });
};
