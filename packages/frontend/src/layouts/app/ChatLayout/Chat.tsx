import { Avatar } from "@/components/ui/avatar";
import {
  ChevronLeft,
  CreditCard,
  Globe as GlobeIcon,
  Brain,
  MicIcon,
  SendIcon,
  StopCircleIcon,
  Paperclip,
  Menu,
  XCircle,
  Sparkles,
  Search,
  FileSearch,
  MessageSquare,
  Bot,
} from "lucide-react";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatDistance } from "date-fns";
import { Loader } from "@/components/ui/loader";
import { ChatMessage } from "./ChatMessage";
import { DataAccessTag } from "@/components/app/DataAccessTag";
import { ChatDropdown } from "./ChatDropdown";
import { getUserLabel } from "@/utils/user";
import { ChatMessageLoader } from "./ChatMessageLoader";
import { Input, Button, Form, App, Popover, Radio, Modal, Tag } from "antd";
import { useChatDraftMessage } from "@/hooks/chat/useChatDraftMessage";
import { ScrollToBottomButton } from "@/components/ui/scroll-button";
import { ChatsCurrentDate } from "@/components/app/Chat/ChatsCurrentDate";
import groupBy from "lodash/groupBy";
import { twMerge } from "tailwind-merge";
import { useInputCursorPosition } from "@/hooks/useInputCursorPosition";
import { useRouter } from "next/router";
import { useChatContext } from "@/context/ChatContext";
import { USER_APP_ROUTES } from "@/routing/routes";
import { useOrganization } from '@/hooks/admin/useOrganization';
import { useCreateThreadAttachment } from "@/hooks/chat/useCreateThreadAttachment";
import { AttachmentSchema } from "common";
import { useQuery } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export type ChatProps = {
  threadId?: string;
  onBack?: () => void;
};

const LoadingStates = [
  { icon: Brain, text: "Analysing context..." },
  { icon: FileSearch, text: "Searching relevant documents..." },
  { icon: Search, text: "Processing information..." },
  { icon: MessageSquare, text: "Generating response..." }
];

export const Chat: FunctionComponent<ChatProps> = ({ threadId, onBack }) => {
  const { notification } = App.useApp();
  const router = useRouter();
  const {
    messages,
    owner,
    thread,
    streaming,
    lastMessage,
    isLoading,
    hasEnoughMessages,
    setThreadId,
    startListening,
    isListening,
    stopListening,
    onTranscribe,
    onTranscribeEnd,
    isTranscribingAudio,
    isStreamingSupported,
    isLoadingSendMessage,
    onSendMessage,
    onCancelAssistantStream,
    isCancellingAssistantStream: isLoadingCancel,
    sendingMessage,
    isWebSearchEnabledForThread,
    toggleWebSearch,
  } = useChatContext();
  const [form] = Form.useForm<{ message: string }>();
  const [message, setMessage] = useChatDraftMessage(threadId || "");
  const [localMessage, setLocalMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDirectStop, setIsDirectStop] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentSchema[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { selectionStart, selectionEnd } = useInputCursorPosition({
    textareaRef,
  });

  const isThreadTagDeleted = useMemo(() => !!thread?.tag?.deletedAt, [thread]);
  const isAgentThread = useMemo(() => !!thread?.agent_run, [thread]);
  const isAgentInstanceNameAvailable = useMemo(() => isAgentThread && !!thread?.agent_instance_id, [isAgentThread, thread?.agent_instance_id]);
  const { data: organization } = useOrganization();
  const currentModel = thread?.user?.ai_user_model || organization?.ai_model || '';
  const unsupportedWebModels = ['o3-mini', 'o1', 'o3', 'o4-mini'];
  const isWebSearchUnsupported = unsupportedWebModels.includes(currentModel);
  const webSearchTitle = isWebSearchUnsupported
    ? "Your current AI model doesn't support web search, select a different model from settings"
    : isWebSearchEnabledForThread
      ? 'Disable web search'
      : 'Enable web search';
  const isWebSearchToggleDisabled =
    !owner || isLoadingCancel || isLoadingSendMessage || isThreadTagDeleted || isWebSearchUnsupported;
  const reasoningModels = ['o1', 'o3', 'o3-mini', 'o4-mini'];
  const isReasoningModel = reasoningModels.includes(currentModel);
  const [reasoningLevel, setReasoningLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [reasoningPopoverOpen, setReasoningPopoverOpen] = useState(false);
  const [reasoningModalOpen, setReasoningModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadAttachment } = useCreateThreadAttachment();

  const [loadingStateIndex, setLoadingStateIndex] = useState(0);

  // Define a variable for models that should hide web search and attachment
  const hideWebSearchAndAttachment = currentModel === 'o3-mini' || currentModel === 'o1';

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && threadId) {
      setIsUploading(true);
      try {
        const uploadedAttachment = await uploadAttachment({ threadId, file });
        setAttachments(prev => [...prev, uploadedAttachment]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Upload initiation failed:", error);
      } finally {
        setIsUploading(false);
      }
    }
  }, [threadId, uploadAttachment]);

  const groupedMessages = useMemo(() => {
    const allMessages = messages.slice();
    let threadTagDeletedMessage = null;
    if (thread?.tag?.deletedAt) {
      threadTagDeletedMessage = {
        content: "Thread tag deleted, Unable to send new messages",
        role: "system",
        timestamp: new Date(thread.tag.deletedAt).toISOString(),
        sources: [],
      };
    }

    if (sendingMessage) {
      allMessages.unshift({
        content: sendingMessage,
        role: "user",
        timestamp: new Date().toISOString(),
        sources: [],
      });
    }

    if (threadTagDeletedMessage) {
      allMessages.unshift(threadTagDeletedMessage);
    }

    if (!allMessages.length && thread) {
      if (threadTagDeletedMessage) {
        return {
          [threadTagDeletedMessage.timestamp]: [threadTagDeletedMessage],
        };
      }
      return { [new Date(thread.created_at).toDateString()]: [] };
    }

    // For agent threads, don't reverse message order so request appears before response
    const messagesToGroup = isAgentThread ? allMessages : allMessages.reverse();
    
    return groupBy(messagesToGroup, (m) =>
      new Date(m.timestamp).toDateString(),
    );
  }, [messages, sendingMessage, thread, isAgentThread]);

  const canSendMessage = useMemo(
    () => owner && !isLoadingSendMessage && !thread?.archived,
    [isLoadingSendMessage, owner, thread],
  );

  const handleSend = useCallback(async () => {
    if (!thread?.id) return;
    if (isThreadTagDeleted) return;
    if (!canSendMessage) return;
    if (isListening) {
      setIsDirectStop(true);
      stopListening();
    }

    if (!hasEnoughMessages) {
      notification.error({
        description:
          "Chat limits exceeded, subscribe to a plan or buy add-on messages",
        message: "Limits Reached",
        btn: (
          <Button
            size="small"
            color="primary"
            variant="link"
            icon={<CreditCard className="h-4 w-4" />}
            onClick={() =>
              router.push(USER_APP_ROUTES.getPath("settingsBilling"))
            }
          >
            Go to Billing
          </Button>
        ),
      });
      return;
    }
    const newMessage: string = localMessage;
    if (!newMessage && attachments.length === 0) return;

    const sendOptions = isReasoningModel ? { reasoningEffort: reasoningLevel } : undefined;

    const thread_attachment_ids = attachments.map(att => att.id);

    onSendMessage({
      id: thread.id,
      message: newMessage,
      options: sendOptions,
      thread_attachment_ids,
    });

    setMessage("");
    setLocalMessage("");
    form.setFieldValue(["message"], "");
    setAttachments([]);
  }, [
    thread?.id,
    isThreadTagDeleted,
    canSendMessage,
    isListening,
    hasEnoughMessages,
    onSendMessage,
    setMessage,
    setLocalMessage,
    form,
    stopListening,
    notification,
    router,
    reasoningLevel,
    isReasoningModel,
    attachments,
    localMessage,
  ]);

  const toggleRecording = useCallback(async () => {
    if (!threadId) return;
    if (isThreadTagDeleted) return;
    if (isListening) {
      onTranscribe();
      stopListening();
      return;
    }
    let newMessage = message ?? "";
    let start = "";
    let end = "";
    if (message && selectionStart >= 0) {
      start = newMessage.slice(0, selectionStart).trim();
    }
    if (message && selectionEnd >= 0) {
      end = newMessage.slice(selectionEnd).trim();
    }

    setIsDirectStop(false);

    await startListening((newValue: string) => {
      newMessage = `${start ? `${start} ` : ""}${newValue}${end ? ` ${end}` : ""}`;
      form.setFieldValue(["message"], newMessage);
    });

    setTimeout(() => {
      if (isDirectStop) {
        form.setFieldValue(["message"], "");
      } else {
        setMessage(form.getFieldValue(["message"]));
      }
    }, 100);

    onTranscribeEnd(threadId);
  }, [
    isDirectStop,
    threadId,
    isThreadTagDeleted,
    isListening,
    message,
    selectionStart,
    selectionEnd,
    startListening,
    onTranscribeEnd,
    setMessage,
    form,
    onTranscribe,
    stopListening,
  ]);

  const stopListeningIfStreaming = useCallback(() => {
    if (!isStreamingSupported) return;
    if (!isListening) return;
    stopListening();
  }, [isStreamingSupported, isListening, stopListening]);

  useEffect(() => {
    setThreadId(threadId);
  }, [setThreadId, threadId]);

  useEffect(() => {
    setLocalMessage(message || "");
  }, [message, threadId]);

  useEffect(() => {
    if (!(streaming || isLoadingSendMessage)) {
      return;
    }
    const scrollContainer = containerRef.current;
    if (!scrollContainer) {
      return;
    }
    const tempMessageLoader = scrollContainer.querySelector(
      "[data-id='temp-chat-loader']",
    );

    if (tempMessageLoader) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      return;
    }
    const scrollOffset =
      scrollContainer.scrollHeight - scrollContainer.scrollTop;

    if (scrollOffset - scrollContainer.clientHeight <= 50) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [containerRef, lastMessage?.content, streaming, isLoadingSendMessage]);

  useEffect(() => {
    if (!isLoadingSendMessage) {
      setLoadingStateIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStateIndex((prev) => (prev + 1) % LoadingStates.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoadingSendMessage]);

  // Add query for suggested prompts
  const { data: suggestedPrompts = [] } = useQuery<string[], Error>(
    ["suggestedPrompts", thread?.tag?.id],
    async () => {
      if (!thread?.tag?.id) return [];
      const prompts = await getAPI().post(API.getSuggestedPrompts, { tagId: thread.tag.id });
      return prompts || [];
    },
    {
      enabled: !!thread?.tag?.id && messages.length === 0,
    }
  );

  if (isLoading) return <Loader className="size-12 mx-auto mt-24" />;

  if (!threadId)
    return (
      <div className="text-center text-2xl font-semibold text-neutral-400 py-24 w-full flex-1">
        Select a thread
      </div>
    );

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="flex items-center">
          <button className="block lg:hidden" onClick={onBack}>
            <ChevronLeft className="text-neutral-400" />
          </button>
          <Avatar
            className="h-9 w-9 shrink-0 bg-blue-950"
            src="/images/logo-blue-bg.png"
          />
          <div className="ml-2.5">
            <h2 className="font-semibold text-sm">
              {!!thread?.user && getUserLabel(thread?.user)}
            </h2>
            <div className="font-medium text-gray-600 text-xs mb-0.5">
              {thread?.name}
              {isAgentThread && (
                <span className="ml-2">
                  <Tag color="blue" className="text-[10px] px-1 py-0 flex items-center">
                    <Bot className="h-3 w-3 mr-1" /> Agent
                  </Tag>
                </span>
              )}
            </div>
            {lastMessage?.timestamp && (
              <p className="text-xs text-gray-400 leading-tight">
                last message sent:{" "}
                {formatDistance(lastMessage.timestamp, new Date(), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        </div>
        {thread && (
          <div className="flex items-center gap-2">
            <DataAccessTag tag={thread.tag} className="text-[11px] lg:text-[12px]" />
            {owner && <ChatDropdown id={thread.id} />}
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="flex-1 min-h-0 h-full custom-scroll px-4 pb-4 relative"
      >
        {messages.length === 0 && !sendingMessage && !isLoadingSendMessage && suggestedPrompts?.length > 0 && !isAgentThread ? (
          <div className="flex flex-col items-center justify-center min-h-fit md:h-full px-2">
            <div className="w-full max-w-2xl space-y-3 md:space-y-4 md:-mt-20 mt-4">
              <div className="text-center mb-3 md:mb-6">
                <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mx-auto mb-1.5 md:mb-2" />
                <h2 className="text-base md:text-lg font-semibold text-gray-700">Suggested prompts</h2>
                <p className="text-xs md:text-sm text-gray-500">Click any prompt to start the conversation</p>
              </div>
              <div className="grid gap-1.5 md:gap-2">
                {suggestedPrompts.map((prompt: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      setLocalMessage(prompt);
                      form.setFieldValue(["message"], prompt);
                    }}
                    className="w-full text-left p-2.5 md:p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 group"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="flex-1 text-sm md:text-base text-gray-700 group-hover:text-blue-600 line-clamp-2 md:line-clamp-none">{prompt}</div>
                      <SendIcon className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 group-hover:text-blue-500 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            {Object.keys(groupedMessages).map((date) => (
              <div key={date} className="space-y-4 first:pt-0">
                <ChatsCurrentDate 
                  date={date} 
                  containerRef={containerRef} 
                  messageCount={groupedMessages[date].length} 
                />
                {groupedMessages[date].map((chatMessage, index) => (
                  <ChatMessage {...chatMessage} key={index} />
                ))}
              </div>
            ))}
            {isLoadingSendMessage && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  {React.createElement(LoadingStates[loadingStateIndex].icon, {
                    className: "w-4 h-4 text-blue-600 animate-pulse"
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm text-gray-900">
                      {LoadingStates[loadingStateIndex].text}
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {streaming ? 'Streaming response...' : 'Processing your request...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Floating chat input bar, ChatGPT style */}
      {isAgentThread ? (
        <div className="w-full flex flex-col items-center pb-4 pt-2 px-2 md:px-0">
          <div className="flex items-center w-full max-w-3xl mx-auto bg-gray-50 rounded-full px-4 py-3 border border-gray-200">
            <div className="text-sm text-gray-500 w-full text-center flex items-center justify-center gap-2">
              <Bot className="h-4 w-4" />
              This is an agent-generated thread. You cannot send messages here.
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center pb-4 pt-2 px-2 md:px-0">
          {/* Show attached files above the chat bar */}
          {attachments.length > 0 && (
            <div className="w-full max-w-3xl mx-auto mb-2 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center bg-gray-100 border border-gray-200 rounded px-3 py-1 text-sm text-gray-700">
                  <span className="truncate max-w-xs" title={att.filename}>{att.filename}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<XCircle className="h-4 w-4 text-gray-400 hover:text-red-500 ml-2" />}
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="ml-1 p-0"
                    aria-label={`Remove ${att.filename}`}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center w-full max-w-3xl mx-auto bg-white rounded-full shadow-lg px-3 py-1.5 gap-2 border border-gray-200">
            {/* Desktop: show all action buttons inline */}
            <div className="hidden md:flex items-center gap-2">
              {/* Mic button */}
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<MicIcon className={twMerge(isListening ? "text-red-500 animate-pulse h-5 w-5" : "text-gray-500 h-5 w-5")} />}
                disabled={!owner || isLoadingCancel || isLoadingSendMessage || isThreadTagDeleted}
                onClick={toggleRecording}
                className="bg-transparent border-none shadow-none"
              />
              {/* Brain icon for reasoning level (desktop) */}
              {isReasoningModel && (
                <Popover
                  content={
                    <Radio.Group
                      value={reasoningLevel}
                      onChange={(e) => {
                        setReasoningLevel(e.target.value);
                        setReasoningPopoverOpen(false);
                      }}
                      options={[
                        { label: 'Low', value: 'low' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'High', value: 'high' },
                      ]}
                      optionType="button"
                      buttonStyle="solid"
                    />
                  }
                  title="Reasoning effort"
                  trigger="click"
                  open={reasoningPopoverOpen}
                  onOpenChange={setReasoningPopoverOpen}
                >
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    icon={<Brain className="text-gray-500 h-5 w-5" />}
                    title={`Reasoning: ${reasoningLevel}`}
                  />
                </Popover>
              )}
              {/* Only show web search and attachment if not o3-mini or o1 */}
              {!hideWebSearchAndAttachment && (
                <>
                  {/* Web search button */}
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    icon={<GlobeIcon className={twMerge(isWebSearchEnabledForThread ? "text-blue-600 h-5 w-5" : "text-gray-500 h-5 w-5")} />}
                    disabled={isWebSearchToggleDisabled}
                    onClick={() => !isWebSearchUnsupported && toggleWebSearch()}
                    title={webSearchTitle}
                    className="bg-transparent border-none shadow-none"
                  />
                  {/* Attachment button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    icon={<Paperclip className="text-gray-500 h-5 w-5" />}
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload file"
                    loading={isUploading}
                    disabled={isUploading || !owner || isThreadTagDeleted}
                    className="bg-transparent border-none shadow-none"
                  />
                </>
              )}
            </div>
            {/* Mobile: show menu button with modal for reasoning */}
            <div className="flex md:hidden items-center">
              <Popover
                trigger="click"
                placement="topLeft"
                content={
                  <div className="flex flex-col space-y-2 bg-white p-2 rounded shadow">
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<MicIcon className={twMerge(isListening ? "text-red-500 animate-pulse h-5 w-5" : "text-gray-500 h-5 w-5")} />}
                      disabled={!owner || isLoadingCancel || isLoadingSendMessage || isThreadTagDeleted}
                      onClick={toggleRecording}
                      title="Record Audio"
                    />
                    {isReasoningModel && (
                      <Button
                        type="text"
                        shape="circle"
                        size="small"
                        icon={<Brain className="text-gray-500 h-5 w-5" />}
                        title={`Reasoning: ${reasoningLevel}`}
                        onClick={() => setReasoningModalOpen(true)}
                      />
                    )}
                    {!hideWebSearchAndAttachment && (
                      <>
                        <Button
                          type="text"
                          shape="circle"
                          size="small"
                          icon={<GlobeIcon className={twMerge(isWebSearchEnabledForThread ? "text-blue-600 h-5 w-5" : "text-gray-500 h-5 w-5")} />}
                          disabled={isWebSearchToggleDisabled}
                          onClick={() => !isWebSearchUnsupported && toggleWebSearch()}
                          title={webSearchTitle}
                        />
                        <Button
                          type="text"
                          shape="circle"
                          size="small"
                          icon={<Paperclip className="text-gray-500 h-5 w-5" />}
                          onClick={() => fileInputRef.current?.click()}
                          title="Upload file"
                          loading={isUploading}
                          disabled={isUploading || !owner || isThreadTagDeleted}
                        />
                      </>
                    )}
                  </div>
                }
              >
                <Button type="text" shape="circle" size="small" icon={<Menu className="h-5 w-5 text-gray-500" />} />
              </Popover>
              <Modal
                open={reasoningModalOpen}
                onCancel={() => setReasoningModalOpen(false)}
                footer={null}
                title="Select Reasoning Level"
                centered
                bodyStyle={{ padding: 24 }}
              >
                <Radio.Group
                  value={reasoningLevel}
                  onChange={(e) => {
                    setReasoningLevel(e.target.value);
                    setReasoningModalOpen(false);
                  }}
                  options={[
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                  ]}
                  optionType="button"
                  buttonStyle="solid"
                  className="w-full flex flex-col gap-2"
                />
              </Modal>
            </div>
            {/* Message input */}
            <Input.TextArea
              ref={textareaRef}
              value={localMessage}
              placeholder="Type a message..."
              disabled={!owner || isThreadTagDeleted}
              onChange={(e) => setLocalMessage(e.target.value)}
              onBlur={() => setMessage(localMessage)}
              onPressEnter={(e) => {
                if (!e.shiftKey && canSendMessage) {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSend();
                }
              }}
              onClick={stopListeningIfStreaming}
              autoSize={{ minRows: 1, maxRows: 1 }}
              className="flex-1 bg-transparent border-none px-3 py-1 focus:ring-0 text-base min-h-[28px] max-h-[32px] resize-none shadow-none placeholder:align-middle placeholder:text-gray-400 placeholder:pl-1"
              style={{ boxShadow: 'none', outline: 'none' }}
            />
            {/* Send button */}
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={streaming ? <StopCircleIcon /> : <SendIcon />}
              disabled={
                streaming
                  ? (!owner || isThreadTagDeleted)
                  : (
                    !owner ||
                    isThreadTagDeleted ||
                    isLoadingCancel ||
                    isLoadingSendMessage ||
                    isTranscribingAudio ||
                    (!isStreamingSupported && isListening) ||
                    (localMessage.trim().length === 0 && attachments.length === 0)
                  )
              }
              onClick={streaming ? onCancelAssistantStream : handleSend}
              className="ml-1"
            />
          </div>
          {/* Info line below the bar */}
          <div className="w-full max-w-3xl mx-auto text-center text-xs text-gray-400 mt-1 mb-0.5 select-none">
            Centrus may make mistakes. Check important info.
          </div>
        </div>
      )}
    </div>
  );
};
