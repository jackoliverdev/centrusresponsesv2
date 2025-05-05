import { useChat } from '@/hooks/chat/useChat';
import { useUpdateChat } from '@/hooks/chat/useUpdateChat';
import { Input, Modal, ModalProps } from 'antd';
import { FunctionComponent, useEffect, useState } from 'react';

export type RenameChatModalProps = ModalProps & {
  id: string;
  onCancel?: () => void;
};

export const RenameChatModal: FunctionComponent<RenameChatModalProps> = ({
  id,
  ...props
}) => {
  const { data: chat } = useChat(id);
  const [name, setName] = useState('');
  const { mutate: updateChat, isLoading } = useUpdateChat();

  useEffect(() => {
    if (chat) setName(chat.name);
  }, [chat]);

  return (
    <Modal
      title="Rename Chat"
      onOk={() =>
        updateChat(
          { id, data: { name } },
          { onSuccess: () => props.onCancel?.() },
        )
      }
      onCancel={() => props.onCancel?.()}
      okButtonProps={{ disabled: !name, loading: isLoading }}
      {...props}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Chat name"
      />
    </Modal>
  );
};
