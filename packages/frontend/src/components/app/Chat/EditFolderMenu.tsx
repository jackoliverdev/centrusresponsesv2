import React, {
  useState,
  useCallback,
  FunctionComponent,
  useEffect,
} from "react";
import { Check, FolderIcon, PencilIcon } from "lucide-react";
import { Dropdown, message, Button, Form, Input } from "antd";
import { COLORS, FolderSchema, FolderWithThreadsSchema } from "common";
import { useUpdateThreadFolder } from "@/hooks/chat/useUpdateThreadFolder";
import { twMerge } from "tailwind-merge";
import classNames from "classnames";

type Props = {
  folder: FolderWithThreadsSchema;
};

export const EditFolderMenu: FunctionComponent<Props> = ({ folder }) => {
  const { mutate: updateFolder, isLoading: isUpdating } =
    useUpdateThreadFolder();
  const [form] =
    Form.useForm<Pick<FolderSchema, "name" | "color" | "global">>();
  const selectedColor = Form.useWatch(["color"], form);
  const [open, setOpen] = useState(false);

  const handleFolderUpdate = useCallback(
    (data: Pick<FolderSchema, "name" | "color" | "global">) => {
      if (!form.isFieldsTouched()) {
        return;
      }
      updateFolder(
        {
          ...data,
          name: data.name.trim(),
          id: folder.id,
        },
        {
          onSuccess: () => {
            setOpen(false);
            return void message.success("Folder updated successfully");
          },
          onError: () => void message.error("Failed to update folder"),
        },
      );
    },
    [form, updateFolder, folder.id],
  );

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        color: folder.color,
        name: folder.name,
        global: folder.global,
      });
    } else {
      form.resetFields();
    }
  }, [form, open, folder]);

  return (
    <Dropdown
      open={open}
      onOpenChange={handleOpenChange}
      trigger={["click"]}
      placement="bottomRight"
      dropdownRender={() => (
        <div
          className="rounded-md bg-white shadow-lg p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-base font-semibold">Folder Options</h4>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            disabled={isUpdating}
            onFinish={handleFolderUpdate}
          >
            <Form.Item
              name="name"
              label="Folder Name"
              rules={[
                {
                  required: true,
                  message: "Please input folder name",
                  type: "string",
                },
                {
                  message: "30 characters maximum",
                  type: "string",
                  max: 30,
                },
              ]}
            >
              <Input
                placeholder="folder name"
                size="small"
                prefix={
                  <FolderIcon
                    className="size-4"
                    style={{ color: selectedColor }}
                  />
                }
              />
            </Form.Item>

            <Form.Item name="color" label="Folder Color" noStyle>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => form.setFieldValue("color", color)}
                    className={twMerge(
                      "w-6 h-6 rounded-full transition-transform flex items-center justify-center",
                      "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                      selectedColor === color &&
                        "ring-2 ring-offset-2 ring-blue-500",
                      isUpdating && "opacity-50 cursor-not-allowed",
                    )}
                    style={{ backgroundColor: color }}
                    disabled={isUpdating}
                  >
                    {selectedColor === color && (
                      <Check className="h-2 w-2 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </Form.Item>

            <Form.Item name="global" label="" noStyle />

            <div className="flex justify-end gap-4 mt-4">
              <Button
                size="small"
                disabled={isUpdating}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="small"
                type="primary"
                loading={isUpdating}
                htmlType="submit"
              >
                Update
              </Button>
            </div>
          </Form>
        </div>
      )}
    >
      <Button
        type="text"
        variant="text"
        shape="circle"
        className={classNames(
          "opacity-0 !p-0 data-[state=open]:opacity-100 transition-opacity",
          open ? "opacity-100 " : "group-hover:opacity-100",
        )}
        loading={isUpdating}
        icon={<PencilIcon className="h-3 w-3" />}
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  );
};
