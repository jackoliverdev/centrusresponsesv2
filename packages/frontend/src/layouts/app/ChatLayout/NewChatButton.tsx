import { DataAccessTag } from '@/components/app/DataAccessTag';
import { useAuthContext } from '@/context/AuthContext';
import { useCreateChat } from '@/hooks/chat/useCreateChat';
import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Modal, Select } from 'antd';
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { USER_APP_ROUTES } from '@/routing/routes';

export type NewChatButtonProps = {
  onSuccess: (id: string) => void;
};

export const NewChatButton: FunctionComponent<NewChatButtonProps> = ({
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<string>();

  const { user, refresh, isOrgAdmin } = useAuthContext();
  const { mutate: createChat, isLoading: isLoadingCreateChat } =
    useCreateChat();

  const handleCreateChat = useCallback(() => {
    if (!tag) return message.error('Please select a tag');
    createChat(
      { tag },
      {
        onSuccess: ({ id }) => {
          onSuccess?.(id);
          setOpen(false);
          setTag(undefined);
        },
      },
    );
  }, [createChat, onSuccess, tag]);

  const { tags = [] } = user || {};

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={isLoadingCreateChat}
        icon={<PlusOutlined />}
        type="primary"
      >
        Start new chat
      </Button>
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setTag(undefined);
        }}
        title="New chat"
        okButtonProps={{ disabled: !tag, loading: isLoadingCreateChat }}
        onOk={handleCreateChat}
      >
        {tags.length === 0 && (
          <div className="text-gray-700 py-4">
            {isOrgAdmin ? (
              <p>
                You do not have any tags.{' '}
                <Link href={USER_APP_ROUTES.getPath('users')} className="text-blue-600 hover:underline">
                  Apply tags here
                </Link>{' '}
                to start creating chats.
              </p>
            ) : (
              <p>
                You do not have any tags. Please ask an admin user to apply tags to your account.
              </p>
            )}
          </div>
        )}
        {tags.length > 0 && (
          <Select
            options={tags.map((t) => ({
              label: <DataAccessTag tag={t} />,
              value: t.name,
            }))}
            value={tag}
            onChange={setTag}
            className="min-w-64"
            placeholder="Select a tag"
          />
        )}
      </Modal>
    </>
  );
};
