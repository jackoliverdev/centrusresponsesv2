import { getAPI } from "@/utils/api";
import { API } from "common";
import { useMutation } from "react-query";
import { mutationErrorHandler } from "@/utils/error";

export const useTranscribeAudioDocument = () => {
  return useMutation({
    mutationFn: async (
      params: ReturnType<typeof API.transcribeAudio.getTypedRequestBody>,
    ) => {
      return getAPI().post(API.transcribeAudio, params);
    },
    onError: mutationErrorHandler,
  });
};
