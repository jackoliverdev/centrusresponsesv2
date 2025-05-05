import { useChat } from "@/hooks/chat/useChat";
import { useUpdateChat } from "@/hooks/chat/useUpdateChat";
import {
  EditOutlined,
  LoadingOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Dropdown, message, Spin } from "antd";
import { Archive, ExternalLink } from "lucide-react";
import { FunctionComponent, useState } from "react";
import { RenameChatModal } from "./RenameChatModal";

export type ChatDropdownProps = {
  id: string;
};

export const ChatDropdown: FunctionComponent<ChatDropdownProps> = ({ id }) => {
  const { mutate: updateChat, isLoading } = useUpdateChat();
  const { data: chat } = useChat(id);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dropdown
        placement="bottomRight"
        disabled={isLoading}
        menu={{
          items: [
            {
              key: "archive",
              label: chat?.archived ? "Unarchive" : "Archive",
              icon: chat?.archived ? (
                <ExternalLink className="size-3" />
              ) : (
                <Archive className="size-3" />
              ),
              onClick: () =>
                updateChat(
                  { id, data: { archived: !chat?.archived } },
                  {
                    onSuccess: (_, { data: { archived } }) =>
                      void message.success(
                        archived ? "Archived" : "Unarchived",
                      ),
                  },
                ),
            },
            {
              key: "rename",
              label: "Rename",
              icon: <EditOutlined />,
              onClick: () => setOpen(true),
              disabled: chat?.archived,
            },
          ].filter(({ disabled }) => !disabled),
        }}
        trigger={["click"]}
      >
        <span>
          {isLoading ? (
            <Spin indicator={<LoadingOutlined spin />} size="small" />
          ) : (
            <SettingOutlined className="cursor-pointer" />
          )}
        </span>
      </Dropdown>
      <RenameChatModal id={id} open={open} onCancel={() => setOpen(false)} />
    </>
  );
};
