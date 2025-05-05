import { useCallback, useMemo, useState, useEffect } from "react";
import { useAuthContext } from "./AuthContext";
import { scaffoldContext } from "@/context/scaffoldContext";
import { usePlan } from "@/hooks/plan/usePlan";
import { useChat } from "@/hooks/chat/useChat";
import { useStreamingMessage } from "@/hooks/chat/useIsStreamingMessage";
import { useSendMessage } from "@/hooks/chat/useSendMessage";
import { useCancelChatMessage } from "@/hooks/chat/useCancelChatMessage";
import { useSpeechToText } from "@/hooks/chat/useSpeechToText";

type ThreadStatus =
  | "transcribing"
  | "transcribed"
  | "processing"
  | "cancelling"
  | "success"
  | "failed";

const useChatContextValue = () => {
  const { user } = useAuthContext();
  const { data: plan } = usePlan();
  const { usages, usageLimits } = plan || {};
  const [threadId, setThreadId] = useState<string>();
  const [chats, setChats] = useState<
    Record<string, { status: ThreadStatus; id: string; message?: string }>
  >({});

  // Web search state per thread (persisted in localStorage)
  const [webSearchEnabled, setWebSearchEnabled] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('web-search-enabled');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('web-search-enabled', JSON.stringify(webSearchEnabled));
  }, [webSearchEnabled]);

  const toggleWebSearch = useCallback((enabled?: boolean) => {
    if (!threadId) return;
    setWebSearchEnabled(prev => ({
      ...prev,
      [threadId]: enabled !== undefined ? enabled : !prev[threadId],
    }));
  }, [threadId]);

  const isWebSearchEnabledForThread = useMemo(() => {
    if (!threadId) return false;
    return !!webSearchEnabled[threadId];
  }, [threadId, webSearchEnabled]);

  const { data: thread, isLoading } = useChat(threadId ?? "");
  const { data: streaming = false } = useStreamingMessage(threadId ?? "");
  const { mutate: sendMessage } = useSendMessage();
  const { mutate: cancel } = useCancelChatMessage();
  const { startListening, isListening, stopListening, isStreamingSupported } =
    useSpeechToText();

  const { messages = [] } = thread || {};
  const lastMessage = messages[0];
  const owner = thread?.user_id == user?.id;

  const hasEnoughMessages = useMemo(() => {
    const messageUsage = usages?.messages ?? 0;
    const messageLimit = usageLimits?.messages ?? 0;
    console.log("Message check:", { 
      messageUsage, 
      messageLimit, 
      hasEnough: messageUsage < messageLimit,
      userId: user?.id
    });
    return messageUsage < messageLimit;
  }, [usages, usageLimits, user]);

  const setThreadStatus = useCallback(
    (id: string, status: ThreadStatus, message?: string) => {
      setChats((prev) => ({
        ...prev,
        [id]: { id, status, message },
      }));
    },
    [],
  );

  const onSendMessage = useCallback(
    ({
      id,
      message,
      options,
      thread_attachment_ids,
    }: {
      id: string;
      message: string;
      options?: { reasoningEffort?: 'low' | 'medium' | 'high' };
      thread_attachment_ids?: string[];
    }) => {
      setThreadStatus(id, "processing", message);
      const finalOptions = {
        useWebSearch: isWebSearchEnabledForThread,
        ...(options ?? {}),
      };
      sendMessage(
        { id, message, options: finalOptions, thread_attachment_ids },
        {
          onSuccess: (_, { id: itemId }) => {
            setThreadStatus(itemId, "success");
          },
          onError: (_, { id: itemId }) => {
            setThreadStatus(itemId, "failed");
          },
        },
      );
    },
    [sendMessage, setThreadStatus, isWebSearchEnabledForThread],
  );

  const onTranscribe = useCallback(() => {
    if (!threadId || isStreamingSupported) {
      return;
    }

    setThreadStatus(threadId, "transcribing");
  }, [isStreamingSupported, setThreadStatus, threadId]);

  const onTranscribeEnd = useCallback(
    (id: string) => {
      if (!id || isStreamingSupported) {
        return;
      }

      setThreadStatus(id, "transcribed");
    },
    [isStreamingSupported, setThreadStatus],
  );

  const onCancelAssistantStream = useCallback(() => {
    if (!threadId) return;
    setThreadStatus(threadId, "cancelling");
    cancel(
      { id: threadId },
      {
        onSuccess: (_, { id }) => {
          setThreadStatus(id, "success");
        },
        onError: (_, { id }) => {
          setThreadStatus(id, "failed");
        },
      },
    );
  }, [cancel, setThreadStatus, threadId]);

  const isLoadingSendMessage = useMemo(
    () => !!threadId && chats[threadId]?.status === "processing",
    [chats, threadId],
  );

  const sendingMessage = useMemo(
    () =>
      !!threadId && isLoadingSendMessage ? chats[threadId]?.message : undefined,
    [chats, isLoadingSendMessage, threadId],
  );

  const isCancellingAssistantStream = useMemo(
    () => !!threadId && chats[threadId]?.status === "cancelling",
    [chats, threadId],
  );

  const isTranscribingAudio = useMemo(
    () => !!threadId && chats[threadId]?.status === "transcribing",
    [chats, threadId],
  );

  const isProcessing = useMemo(
    () => Object.values(chats).some(({ status }) => status === "processing"),
    [chats],
  );

  return useMemo(
    () => ({
      user,
      chats,
      onSendMessage,
      setThreadStatus,
      isProcessing,
      threadId,
      thread,
      hasEnoughMessages,
      isLoading,
      streaming,
      messages,
      lastMessage,
      owner,
      setThreadId,
      startListening,
      isListening,
      stopListening,
      onTranscribe,
      isTranscribingAudio,
      isStreamingSupported,
      isLoadingSendMessage,
      onCancelAssistantStream,
      isCancellingAssistantStream,
      onTranscribeEnd,
      sendingMessage,
      // Web search controls
      isWebSearchEnabledForThread,
      toggleWebSearch,
    }),
    [
      onSendMessage,
      chats,
      isProcessing,
      setThreadStatus,
      user,
      threadId,
      thread,
      hasEnoughMessages,
      isLoading,
      streaming,
      messages,
      lastMessage,
      owner,
      setThreadId,
      startListening,
      isListening,
      stopListening,
      onTranscribe,
      isTranscribingAudio,
      isStreamingSupported,
      isLoadingSendMessage,
      onCancelAssistantStream,
      isCancellingAssistantStream,
      onTranscribeEnd,
      sendingMessage,
      isWebSearchEnabledForThread,
      toggleWebSearch,
    ],
  );
};

const [ChatContextProvider, useChatContext] =
  scaffoldContext(useChatContextValue);

export { ChatContextProvider, useChatContext };
