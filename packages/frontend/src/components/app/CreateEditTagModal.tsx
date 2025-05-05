"use client";

import { useEffect, FunctionComponent, useCallback, useMemo, useState } from "react";
import { Modal, Button, Form, Input, ColorPicker, Tabs, List, Avatar, Tag as AntTag } from "antd";
import { CloseOutlined, FileOutlined, UserOutlined, PlusOutlined } from "@ant-design/icons";
import { useCreateTag } from "@/hooks/tags/useCreateTag";
import { AggregationColor } from "antd/lib/color-picker/color";
import { DEFAULT_TAG_COLORS, TagSchema, TagInfoSchema } from "common";
import { DataAccessTag } from "@/components/app/DataAccessTag";
import { useUpdateTag } from "@/hooks/tags/useUpdateTag";
import { MultipleTagsDropdown } from "./MultipleTagsDropdown";
import { WordDocument } from "@/components/icons/WordDocument";
import { AudioDocument } from "@/components/icons/AudioDocument";
import { PDFDocument } from "@/components/icons/PDFDocument";
import { GenericDocument } from "@/components/icons/GenericDoucment";
import { WebpageDocument } from "@/components/icons/WebpageDocument";
import { ExcelDocument } from "@/components/icons/ExcelDocument";
import { TextDocument } from "@/components/icons/TextDocument";
import { AssignDocumentsModal } from "./AssignDocumentsModal";
import { AssignUsersModal } from "./AssignUsersModal";
import { useQueryClient } from "react-query";
import { useTagsInfo } from "@/hooks/tags/useTagsInfo";
import { useUpdateDocument } from "@/hooks/documents/useUpdateDocument";
import { useAssignUserToTag } from "@/hooks/tags/useAssignUserToTag";

type TagItem = {
  name: string;
  backgroundColor: string | AggregationColor;
  textColor: string | AggregationColor;
  context?: string | null;
};

type Props = {
  open: boolean;
  tag?: TagInfoSchema;
  onClose(success?: boolean): void;
};

// Create presets from our default colors
const bgPresets = [
  {
    label: "Light Tags",
    colors: DEFAULT_TAG_COLORS.slice(0, 10).map((c) => c.backgroundColor),
  },
  {
    label: "Dark Tags",
    colors: DEFAULT_TAG_COLORS.slice(10).map((c) => c.backgroundColor),
  },
];

const txtPresets = [
  {
    label: "Text Colors",
    colors: [
      "#000000",
      "#FFFFFF",
      ...DEFAULT_TAG_COLORS.slice(0, 10).map((c) => c.textColor),
    ],
  },
];

export const CreateEditTagModal: FunctionComponent<Props> = ({
  tag,
  open,
  onClose,
}) => {
  const [form] = Form.useForm<TagItem>();
  const values = Form.useWatch([], form);
  const [showAssignDocuments, setShowAssignDocuments] = useState(false);
  const [showAssignUsers, setShowAssignUsers] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: updateDocument } = useUpdateDocument();
  const { mutate: assignUser } = useAssignUserToTag();

  // Fetch live tag data
  const { data: tagData } = useTagsInfo({
    filters: tag ? [{ key: "id", operator: "eq", value: tag.id }] : [],
    limit: 1,
    page: 1,
  });
  const currentTag = tagData?.data?.[0];

  const { mutate: createTag, isLoading: isLoadingCreateTag } = useCreateTag();
  const { mutate: updateTag, isLoading: isLoadingUpdateTag } = useUpdateTag();

  const isEdit = useMemo(() => !!tag, [tag]);
  const isSubmitting = useMemo(
    () => isLoadingCreateTag || isLoadingUpdateTag,
    [isLoadingCreateTag, isLoadingUpdateTag],
  );

  const formValues = useMemo(() => {
    if (!values) {
      return { name: "", backgroundColor: "", textColor: "", context: "" };
    }

    return {
      name: values.name,
      backgroundColor:
        typeof values.backgroundColor === "string"
          ? values.backgroundColor
          : values.backgroundColor?.toHexString(),
      textColor:
        typeof values.textColor === "string"
          ? values.textColor
          : values.textColor?.toHexString(),
      context: values.context,
    };
  }, [values]);

  const getMatchingTextColor = useCallback((backgroundColor: string) => {
    const matchingDefault = DEFAULT_TAG_COLORS.find(
      (c) => c.backgroundColor === backgroundColor,
    );
    return matchingDefault?.textColor;
  }, []);

  const handleSubmit = useCallback(() => {
    if (isEdit && tag?.id) {
      updateTag(
        {
          id: tag?.id,
          background_color: formValues.backgroundColor,
          text_color: formValues.textColor,
          context: formValues.context,
        },
        {
          onSuccess() {
            onClose(true);
          },
        },
      );
    } else {
      createTag(
        {
          name: formValues.name,
          background_color: formValues.backgroundColor,
          text_color: formValues.textColor,
          context: formValues.context,
        },
        {
          onSuccess() {
            onClose(true);
          },
        },
      );
    }
  }, [
    tag?.id,
    isEdit,
    formValues.name,
    formValues.backgroundColor,
    formValues.textColor,
    formValues.context,
    onClose,
    createTag,
    updateTag,
  ]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    } else if (tag) {
      form.setFieldsValue({
        name: tag.name,
        backgroundColor: tag.backgroundColor,
        textColor: tag.textColor,
        context: tag.context || "",
      });
    } else {
      form.setFieldsValue({
        name: "",
        backgroundColor: "#1677ff",
        textColor: "#ffffff",
        context: "",
      });
    }
  }, [form, open, tag]);

  const getDocumentIcon = (filename: string, type: string) => {
    const extension = filename?.split(".")?.pop()?.toLowerCase();
    switch (type) {
      case "text":
        switch (extension) {
          case "pdf":
            return <PDFDocument />;
          case "doc":
          case "docx":
            return <WordDocument />;
          case "xls":
          case "xlsx":
            return <ExcelDocument />;
          case "txt":
            return <TextDocument />;
          default:
            return <GenericDocument />;
        }
      case "audio":
        return <AudioDocument />;
      case "website":
        return <WebpageDocument />;
      default:
        return <GenericDocument />;
    }
  };

  const items = [
    {
      key: 'settings',
      label: 'Settings',
      children: (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          disabled={isSubmitting}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tag Name"
            className="w-full"
            rules={[
              {
                type: "string",
                required: true,
                message: "Tag name is required",
                min: 1,
              },
            ]}
          >
            <Input
              disabled={isEdit}
              placeholder="Enter tag name"
              size="large"
              className="w-full"
            />
          </Form.Item>

          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <label>Background color</label>
              <Form.Item
                name="backgroundColor"
                label="Background Color"
                dependencies={[["textColor"]]}
                initialValue="#1677ff"
                rules={[
                  {
                    required: true,
                    message: "Background color is required",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const textColor = getFieldValue(["textColor"]);
                      const textColorString =
                        typeof textColor === "string"
                          ? textColor
                          : textColor.toHexString();
                      const bgColorString =
                        typeof value === "string"
                          ? value
                          : value?.toHexString();

                      if (value && textColorString === bgColorString) {
                        return Promise.reject(new Error("Same as text"));
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
                noStyle
              >
                <ColorPicker
                  presets={bgPresets}
                  showText
                  onChange={(value) => {
                    const bgColor = value.toHexString();
                    const textColor = getMatchingTextColor(bgColor);
                    if (textColor) {
                      form.setFieldValue(["textColor"], textColor);
                    }
                  }}
                />
              </Form.Item>
            </div>

            <div className="flex flex-col gap-2">
              <label>Text color</label>
              <Form.Item
                name="textColor"
                label="Text Color"
                initialValue="#ffffff"
                dependencies={[["backgroundColor"]]}
                rules={[
                  {
                    required: true,
                    message: "Text color is required",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const bgColor = getFieldValue(["backgroundColor"]);
                      const bgColorString =
                        typeof bgColor === "string"
                          ? bgColor
                          : bgColor.toHexString();
                      const textColorString =
                        typeof value === "string"
                          ? value
                          : value?.toHexString();

                      if (value && bgColorString === textColorString) {
                        return Promise.reject(
                          new Error("Same as background"),
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
                noStyle
              >
                <ColorPicker presets={txtPresets} showText />
              </Form.Item>
            </div>
          </div>

          <Form.Item
            name="context"
            label={
              <div>
                <span>Tag Context</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  These instructions will be passed to the AI in any chats with this tag. This helps ensure more accurate and relevant answers.
                </p>
              </div>
            }
            className="w-full mt-4"
          >
            <Input.TextArea
              placeholder="Enter specific context for this tag (optional)"
              size="large"
              className="w-full"
              rows={4}
              showCount
              maxLength={1000}
            />
          </Form.Item>

          {values?.name && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Preview:</p>
              <DataAccessTag tag={formValues} />
            </div>
          )}
        </Form>
      ),
    },
    {
      key: 'assignments',
      label: 'Assignments',
      children: (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Documents</h3>
              <Button 
                type="text" 
                icon={<PlusOutlined />}
                onClick={() => setShowAssignDocuments(true)}
              >
                Assign Documents
              </Button>
            </div>
            <List
              size="small"
              dataSource={currentTag?.documents || []}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button 
                      key="remove" 
                      type="text" 
                      danger 
                      size="small"
                      onClick={() => {
                        updateDocument({
                          id: item.id,
                          data: { tag_id: null } as any
                        }, {
                          onSuccess: () => {
                            queryClient.invalidateQueries(["tags-info"]);
                          }
                        });
                      }}
                    >
                      Remove
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={getDocumentIcon(item.name, item.type)}
                    title={item.name}
                    description={`${item.type} • ${(item.size / 1024).toFixed(1)} KB`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No documents assigned' }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Users</h3>
              <Button 
                type="text" 
                icon={<PlusOutlined />}
                onClick={() => setShowAssignUsers(true)}
              >
                Assign Users
              </Button>
            </div>
            <List
              size="small"
              dataSource={currentTag?.users || []}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button 
                      key="remove" 
                      type="text" 
                      danger 
                      size="small"
                      onClick={() => {
                        if (!currentTag?.id) return;
                        assignUser({
                          userId: item.user.id,
                          tagId: currentTag.id,
                          action: 'unassign'
                        }, {
                          onSuccess: () => {
                            queryClient.invalidateQueries(["tags-info"]);
                          }
                        });
                      }}
                    >
                      Remove
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.user.image} icon={<UserOutlined />} />}
                    title={`${item.user.firstName || ''} ${item.user.lastName || ''}`}
                    description={item.user.email}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No users assigned' }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={open}
        footer={
          <div className="flex justify-end flex-wrap-reverse items-stretch sm:items-center gap-4">
            <Button
              className="flex-1 sm:flex-grow-0"
              disabled={isSubmitting}
              onClick={() => onClose()}
            >
              Cancel
            </Button>
            <Button
              htmlType="submit"
              type="primary"
              className="flex-1 sm:flex-grow-0"
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              {isEdit ? "Update Tag" : "Create Tag"}
            </Button>
          </div>
        }
        title={
          <h2 className="text-xl font-bold">
            {isEdit ? "Edit Tag Settings" : "Create New Tag"}
          </h2>
        }
        closeIcon={<CloseOutlined className="text-grey-dark" />}
        className="rounded-xl shadow-card-shadow"
        closable={!isSubmitting}
        maskClosable={!isSubmitting}
        keyboard={!isSubmitting}
        onCancel={() => onClose()}
        width={600}
      >
        {open && (
          <Tabs items={items} />
        )}
      </Modal>

      {tag && (
        <>
          <AssignDocumentsModal
            open={showAssignDocuments}
            onClose={() => setShowAssignDocuments(false)}
            currentTag={tag}
          />
          <AssignUsersModal
            open={showAssignUsers}
            onClose={() => setShowAssignUsers(false)}
            currentTag={tag}
            currentUsers={currentTag?.users || []}
          />
        </>
      )}
    </>
  );
};
