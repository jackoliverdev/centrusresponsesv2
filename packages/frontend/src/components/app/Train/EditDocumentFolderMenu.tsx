import React, {
  useState,
  useCallback,
  FunctionComponent,
  useEffect,
  useMemo,
} from "react";
import { Check, FolderIcon, PencilIcon } from "lucide-react";
import { Dropdown, message, Button, Form, Input } from "antd";
import { COLORS, FolderSchema, FolderWithDocumentsSchema } from "common";
import { useUpdateDocumentFolder } from "@/hooks/document/useUpdateDocumentFolder";
import { twMerge } from "tailwind-merge";
import { useAuthContext } from "@/context/AuthContext";

type Props = {
  folder: FolderWithDocumentsSchema;
};

export const EditDocumentFolderMenu: FunctionComponent<Props> = ({ folder }) => {
  const { isOrgAdmin, isPlatformAdmin, user } = useAuthContext();
  const { mutate: updateFolder, isLoading: isUpdating } =
    useUpdateDocumentFolder();
  const [form] =
    Form.useForm<Pick<FolderSchema, "name" | "color" | "global">>();
  const selectedColor = Form.useWatch(["color"], form);
  const [open, setOpen] = useState(false);

  const userCanUpdate = useMemo(() => {
    const isMine = user?.id === folder.userId;
    return isMine || (folder.global && (isOrgAdmin || isPlatformAdmin));
  }, [folder, user, isOrgAdmin, isPlatformAdmin]);

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

  if (!userCanUpdate) {
    return null;
  }

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

            <Form.Item name="color" label="Folder Color">
              <div className="grid grid-cols-8 gap-1">
                {COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => form.setFieldValue("color", color)}
                    className={twMerge(
                      "w-5 h-5 rounded-full transition-transform flex items-center justify-center",
                      "hover:scale-110 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500",
                      selectedColor === color &&
                        "ring-1 ring-offset-1 ring-blue-500",
                      isUpdating && "opacity-50 cursor-not-allowed",
                    )}
                    style={{ backgroundColor: color }}
                    disabled={isUpdating}
                  >
                    {selectedColor === color && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </Form.Item>

            <Form.Item name="global" label="" noStyle />

            <div className="flex justify-end gap-2 mt-4">
              <Button
                disabled={isUpdating}
                size="small"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="small"
                loading={isUpdating}
                htmlType="submit"
              >
                Save
              </Button>
            </div>
          </Form>
        </div>
      )}
    >
      <Button
        type="text"
        variant="text"
        className="text-gray-500 hover:text-gray-700 p-1 h-auto"
        icon={<PencilIcon className="size-3.5" />}
        onClick={(e) => e.stopPropagation()}
      />
    </Dropdown>
  );
}; 