import { getAPI } from "@/utils/api";
import { API } from "common";
import { useMutation } from "react-query";
import { App } from 'antd';
import { mutationErrorHandler } from '@/utils/error';

export const useUpdateTag = () => {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (
      params: ReturnType<typeof API.updateTag.getTypedRequestBody>,
    ) => {
      return getAPI().post(API.updateTag, params);
    },
    onSuccess: () => void message.success("Tag updated successfully."),
    onError: mutationErrorHandler,
  });
};
