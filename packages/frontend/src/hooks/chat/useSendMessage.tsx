import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API, RequestBodyType } from "common";
import { ChatQueryResult, getChatQueryKey } from "./useChat";
import { mutationErrorHandler } from "@/utils/error";
import { getChatsQueryKey } from "./useChats";
import { getIsStreamingMessageQueryKey } from "./useIsStreamingMessage";

export const addMessageToChat = ({
  messages,
  message,
  role,
}: {
  messages: Exclude<ChatQueryResult, undefined>["messages"];
  message: string;
  role: "user" | "assistant";
}) => {
  return [
    { role, content: message, timestamp: new Date().toISOString() },
    ...messages,
  ];
};

// Extend send variable type to include optional web search flag and attachments
type SendMessageVariables = RequestBodyType<typeof API.sendChatMessage>

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation<ReadableStreamDefaultReader<string> | void, unknown, SendMessageVariables>({
    // Destructure thread_attachment_ids from variables
    mutationFn: async ({ message, id, options, thread_attachment_ids }: SendMessageVariables) => {
      // Pass thread_attachment_ids in the payload
      // @ts-ignore: allow passing extra options param for web search
      const stream = await getAPI(undefined, {
        adapter: "fetch",
        responseType: "stream",
      }).post(
        API.sendChatMessage,
        // Include attachments in the body sent to the API
        { message, id, options, thread_attachment_ids } as any
      );
      if (!stream) return;

      const textStream = stream.pipeThrough(new TextDecoderStream());
      return textStream.getReader();
    },
    // Include attachments in the variables passed to onSuccess if needed
    onSuccess: (reader, { id, message, thread_attachment_ids }) => {
      if (!reader) return;
      queryClient.setQueryData<ChatQueryResult>(getChatQueryKey(id), (chat) => {
        if (!chat) return;
        return {
          ...chat,
          messages: [
            {
              role: "assistant",
              content: "",
              timestamp: new Date().toISOString(),
              sources: [],
            },
            {
              role: "user",
              content: message,
              timestamp: new Date().toISOString(),
              sources: [],
            },
            ...chat.messages,
          ],
        };
      });

      const streamToState = async () => {
        queryClient.setQueryData(getIsStreamingMessageQueryKey(id), true);
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            queryClient.setQueryData<ChatQueryResult>(
              getChatQueryKey(id),
              (chat) => {
                if (!chat) return;
                const temp = { ...chat };
                temp.messages[0].content += value;
                return temp;
              },
            );
          }
        } finally {
          reader.releaseLock();
          queryClient.setQueryData(getIsStreamingMessageQueryKey(id), false);
        }

        // Invalidate and refetch to pull in the reasoningSummary via getChatUsingResponses
        await queryClient.invalidateQueries(getChatsQueryKey());
        await queryClient.invalidateQueries(getChatQueryKey(id));
        await queryClient.refetchQueries(getChatQueryKey(id));
      };
      streamToState();
    },
    onError: mutationErrorHandler,
  });
};
