import { getAPI } from "@/utils/api";
import { API } from "common";
import { useMutation } from "react-query";
import { App } from "antd";
import { mutationErrorHandler } from "@/utils/error";

export const useCreateTag = () => {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (
      params: ReturnType<typeof API.createTag.getTypedRequestBody>,
    ) => {
      return getAPI().post(API.createTag, params);
    },
    onSuccess: () => void message.success("Tag created successfully."),
    onError: mutationErrorHandler,
  });
};
