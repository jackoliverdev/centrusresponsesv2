import { App, Button, Divider, Form, Input } from "antd";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { Documents } from "./Documents";
import { DocumentUsage } from "./DocumentUsage";
import { useDocuments } from "@/hooks/documents/useDocuments";
import {
  BoldIcon,
  FileTextIcon,
  Heading1Icon,
  Heading2Icon,
  ItalicIcon,
  MicIcon,
  Trash2Icon,
} from "lucide-react";
import { useSpeechToText } from "@/hooks/chat/useSpeechToText";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { twMerge } from "tailwind-merge";
import { usePlan } from "@/hooks/plan/usePlan";
import { useUploadDocument } from "@/context/UploadDocumentContext";

export type Props = object;

export const TextAudioTab: FunctionComponent<Props> = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ content: string; title: string }>();
  const { data: documents = [], isLoading } = useDocuments();
  const { data: plan } = usePlan();
  const { storageUsage, storageLimit } = plan || {};

  const {
    startListening,
    isListening,
    stopListening,
    isTranscribing,
    isStreamingSupported,
  } = useSpeechToText();

  const { add, notifyFailed } = useUploadDocument();
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-strong:text-inherit max-w-none overflow-y-auto px-3 py-2",
        style: "height: 300px; outline: none;",
      },
    },
    onUpdate({ editor: e }) {
      if (e.getText()) {
        form.setFieldValue("content", e.getHTML());
      } else {
        form.setFieldValue("content", "");
      }
    },
  });

  const audioDocuments = useMemo(
    () => documents.filter((doc) => doc.type === "text"),
    [documents],
  );

  const handleSubmit = useCallback(
    ({ title, content }: { title: string; content: string }) => {
      setIsCreatingDocument(true);
      if (isListening) {
        stopListening();
      }
      const filename = `${title.trim()}.html`;
      const file = new File([content], filename, { type: "text/html" });

      const hasEnoughStorage =
        (storageUsage ?? 0) + file.size <= (storageLimit ?? 0);

      if (!hasEnoughStorage) {
        notifyFailed(filename, file.size);
        void message.error("Document Storage limit exceeded.");
        setIsCreatingDocument(false);
        return;
      }

      add(
        { file, type: "text" },
        {
          onSuccess: () => {
            void message.success("Document created successfully");
            form.resetFields();
            editor?.commands.setContent("");
          },
          onError: () => {
            void message.error("Failed to create document");
          },
          onSettled: () => setIsCreatingDocument(false),
        },
      );
    },
    [
      add,
      editor?.commands,
      form,
      isListening,
      message,
      notifyFailed,
      stopListening,
      storageLimit,
      storageUsage,
    ],
  );

  const clearContent = () => {
    editor?.commands.setContent("");
    form.resetFields();
  };

  const stopListeningIfStreaming = useCallback(() => {
    if (!isStreamingSupported) return;
    if (!isListening) return;
    stopListening();
  }, [isStreamingSupported, isListening, stopListening]);

  const toggleRecording = useCallback(async () => {
    if (!editor) {
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    // merge transcript with existing message
    const {
      state: {
        selection: { from, to },
      },
    } = editor;
    const selectionStart = Math.min(from, to);
    const selectionEnd = Math.max(from, to);
    const end = editor.state.doc.slice(selectionEnd);

    await startListening((newValue) => {
      if (!editor) return;
      const insertEnd = editor.state.doc.nodeSize - 2 - end.size;
      editor.commands.insertContentAt(
        {
          from: selectionStart,
          to: insertEnd,
        },
        newValue,
      );
    });
  }, [isListening, editor, startListening, stopListening]);

  return (
    <div className="space-y-8">
      <Form
        form={form}
        layout="vertical"
        className="bg-white rounded-lg border shadow-sm overflow-hidden"
        onFinish={handleSubmit}
        requiredMark={false}
        disabled={isCreatingDocument}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="rounded-lg bg-blue-50 p-2">
              <FileTextIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Create Text / Audio Document
              </h3>
              <p className="text-sm text-gray-500">
                Add a new document to your knowledge base
              </p>
            </div>
          </div>

          <Form.Item
            label="Document Title"
            name="title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input
              id="title"
              className="mt-1.5"
              placeholder="Enter a descriptive title..."
            />
          </Form.Item>
          <Form.Item
            label="Document Content"
            name="content"
            rules={[
              {
                required: true,
                message: "Please enter contents of document",
              },
            ]}
          >
            <div>
              <div className="border-b mb-2 pb-2">
                {/* Desktop view */}
                <div className="hidden md:flex justify-between items-center gap-2">
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      type={editor?.isActive("bold") ? "primary" : "default"}
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      icon={<BoldIcon className="h-4 w-4" />}
                    >
                      Bold
                    </Button>
                    <Button
                      size="small"
                      type={editor?.isActive("italic") ? "primary" : "default"}
                      onClick={() =>
                        editor?.chain().focus().toggleItalic().run()
                      }
                      icon={<ItalicIcon className="h-4 w-4" />}
                    >
                      Italic
                    </Button>
                    <Button
                      size="small"
                      type={
                        editor?.isActive("heading", { level: 1 })
                          ? "primary"
                          : "default"
                      }
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 1 })
                          .run()
                      }
                      icon={<Heading1Icon className="h-4 w-4" />}
                    >
                      H1
                    </Button>
                    <Button
                      size="small"
                      type={
                        editor?.isActive("heading", { level: 2 })
                          ? "primary"
                          : "default"
                      }
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 2 })
                          .run()
                      }
                      icon={<Heading2Icon className="h-4 w-4" />}
                    >
                      H2
                    </Button>
                    <select
                      className="border rounded px-2 text-sm"
                      onChange={(e) =>
                        editor?.chain().focus().setColor(e.target.value).run()
                      }
                    >
                      <option value="#000000">Black</option>
                      <option value="#0000FF">Blue</option>
                      <option value="#FF0000">Red</option>
                      <option value="#008000">Green</option>
                    </select>
                  </div>
                  <Button
                    size="small"
                    type="default"
                    onClick={clearContent}
                    icon={<Trash2Icon className="h-4 w-4" />}
                    className="flex items-center gap-1"
                  >
                    Clear All
                  </Button>
                </div>

                {/* Mobile view */}
                <div className="md:hidden">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Button
                      size="small"
                      type={editor?.isActive("bold") ? "primary" : "default"}
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      icon={<BoldIcon className="h-4 w-4" />}
                    >
                      B
                    </Button>
                    <Button
                      size="small"
                      type={editor?.isActive("italic") ? "primary" : "default"}
                      onClick={() =>
                        editor?.chain().focus().toggleItalic().run()
                      }
                      icon={<ItalicIcon className="h-4 w-4" />}
                    >
                      I
                    </Button>
                    <Button
                      size="small"
                      type={
                        editor?.isActive("heading", { level: 1 })
                          ? "primary"
                          : "default"
                      }
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 1 })
                          .run()
                      }
                      icon={<Heading1Icon className="h-4 w-4" />}
                    >
                      H1
                    </Button>
                    <Button
                      size="small"
                      type={
                        editor?.isActive("heading", { level: 2 })
                          ? "primary"
                          : "default"
                      }
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 2 })
                          .run()
                      }
                      icon={<Heading2Icon className="h-4 w-4" />}
                    >
                      H2
                    </Button>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      onChange={(e) =>
                        editor?.chain().focus().setColor(e.target.value).run()
                      }
                    >
                      <option value="#000000">Black</option>
                      <option value="#0000FF">Blue</option>
                      <option value="#FF0000">Red</option>
                      <option value="#008000">Green</option>
                    </select>
                    <Button
                      size="small"
                      type="default"
                      onClick={clearContent}
                      icon={<Trash2Icon className="h-4 w-4" />}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
              <div className="border rounded-md">
                <EditorContent
                  editor={editor}
                  onClick={stopListeningIfStreaming}
                  disabled={isCreatingDocument}
                />
              </div>
            </div>
          </Form.Item>
        </div>

        <div className="border-t bg-gray-50 p-4 flex justify-between items-center gap-4">
          <Button
            variant="outlined"
            color="default"
            size="large"
            className={twMerge(
              "rounded-md",
              isListening && "animate-[pulse_1.5s_ease-in-out_infinite]",
            )}
            icon={
              isListening ? (
                <span className="relative flex size-5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-5 rounded-full bg-red-500 items-center justify-center">
                    <span className="relative flex size-3 border-2 border-white rounded-full">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white-400 opacity-75" />
                      <span className="relative inline-flex size-3 rounded-full bg-white-500">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              ) : (
                <MicIcon className="size-4 text-red-500" />
              )
            }
            loading={isTranscribing}
            onClick={toggleRecording}
          >
            {isTranscribing
              ? "Transcribing"
              : isListening
                ? "Stop Recording"
                : "Record Audio"}
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            loading={isCreatingDocument}
            disabled={isTranscribing || (!isStreamingSupported && isListening)}
            className="min-w-[7.5rem]"
            onClick={() => {
              if (isListening) {
                stopListening();
              }
            }}
          >
            Create Document
          </Button>
        </div>
      </Form>
      <Divider>
        <div className="flex items-center gap-2 text-gray-600">
          <FileTextIcon className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Already uploaded</h2>
        </div>
      </Divider>
      <Documents documents={audioDocuments} loading={isLoading} />
      <DocumentUsage />
    </div>
  );
};
