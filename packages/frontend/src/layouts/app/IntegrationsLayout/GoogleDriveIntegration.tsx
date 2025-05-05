import { FunctionComponent } from 'react';
import { Heading } from './Heading';
import { Button, Form, Input } from 'antd';
import { useUpdateOrganization } from '@/hooks/admin/useUpdateOrganization';
import { useOrganization } from '@/hooks/admin/useOrganization';
import { GoogleDrive } from '@/components/icons/GoogleDrive';

export type GoogleDriveIntegrationProps = object;

type FormType = {
  google_client_id: string;
  google_client_secret: string;
};
const FormItem = Form.Item<FormType>;
export const GoogleDriveIntegration: FunctionComponent<
  GoogleDriveIntegrationProps
> = () => {
  const [form] = Form.useForm<FormType>();
  const { data: organization } = useOrganization();
  const { mutate: update, isLoading } = useUpdateOrganization();
  return (
    <div>
      <Heading>
        <GoogleDrive className="size-6" /> Google Drive Sync
      </Heading>
      <Form
        form={form}
        onFinish={({ google_client_id, google_client_secret }) => {
          update({
            google_client_id,
            google_client_secret,
          });
        }}
        initialValues={{
          google_client_id: organization?.google_client_id,
          google_client_secret: organization?.google_client_secret,
        }}
      >
        <FormItem
          name="google_client_id"
          rules={[{ required: true, message: 'Client ID is required' }]}
        >
          <Input type="text" placeholder="Client ID" />
        </FormItem>
        <FormItem
          name="google_client_secret"
          rules={[{ required: true, message: 'Client Secret is required' }]}
        >
          <Input type="text" placeholder="Client Secret" />
        </FormItem>
        <Button type="primary" loading={isLoading} htmlType="submit">
          Save
        </Button>
      </Form>
    </div>
  );
};
