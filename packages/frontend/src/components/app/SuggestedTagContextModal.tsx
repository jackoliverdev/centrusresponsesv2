import { FunctionComponent } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useUpdateSuggestedTagContext } from '@/hooks/organization/useUpdateSuggestedTagContext';

type Props = {
  open: boolean;
  onClose: () => void;
  initialValue?: string;
};

export const SuggestedTagContextModal: FunctionComponent<Props> = ({
  open,
  onClose,
  initialValue = '',
}) => {
  const [form] = Form.useForm();
  const { updateSuggestedTagContext, isLoading } = useUpdateSuggestedTagContext();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await updateSuggestedTagContext(values.suggested_tag_context);
    onClose();
  };

  return (
    <Modal
      title="Edit Suggested Tag Context"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isLoading}
          onClick={handleSubmit}
        >
          Save
        </Button>,
      ]}
    >
      <Form form={form} initialValues={{ suggested_tag_context: initialValue }}>
        <Form.Item
          name="suggested_tag_context"
          label="Context"
          rules={[{ required: true, message: 'Please enter the tag context' }]}
        >
          <Input.TextArea
            rows={6}
            placeholder="Enter context to guide tag suggestions (e.g., 'Documents about marketing should be tagged as Marketing')"
          />
        </Form.Item>
        <div className="text-sm text-gray-500 mt-2">
          This context will be provided to the AI each time it suggests a tag when your organisation uploads a file in the Train page. The AI receives this context as instructions, along with the uploaded file name, the names of all documents already assigned to the tag, relevant user information, and your organisation's context. Use this field to guide the AI on what files should be assigned to which tag by setting clear criteria or rules.<br /><br />
          <strong>Examples:</strong><br />
          Any file name that includes "sales" use tag Sales.<br />
          Any file named "table plan" use tag Catering.
        </div>
      </Form>
    </Modal>
  );
}; 