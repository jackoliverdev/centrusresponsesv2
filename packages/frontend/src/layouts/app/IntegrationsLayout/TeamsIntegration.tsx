import { FunctionComponent } from 'react';
import { Heading } from './Heading';
import { Button, Form, Input } from 'antd';
import { useUpdateOrganization } from '@/hooks/admin/useUpdateOrganization';
import { useOrganization } from '@/hooks/admin/useOrganization';
import { MicrosoftTeams } from '@/components/icons/MicrosoftTeams';

export type TeamsIntegrationProps = object;

type FormType = {
  microsoft_client_id: string;
  microsoft_client_secret: string;
};
const FormItem = Form.Item<FormType>;
export const TeamsIntegration: FunctionComponent<
  TeamsIntegrationProps
> = () => {
  const [form] = Form.useForm<FormType>();
  const { data: organization } = useOrganization();
  const { mutate: update, isLoading } = useUpdateOrganization();
  return (
    <div>
      <Heading>
        <MicrosoftTeams className="size-6" /> Microsoft Teams Sync
      </Heading>
      <Form
        form={form}
        onFinish={({ microsoft_client_id, microsoft_client_secret }) => {
          update({
            microsoft_client_id,
            microsoft_client_secret,
          });
        }}
        initialValues={{
          microsoft_client_id: organization?.microsoft_client_id,
          microsoft_client_secret: organization?.microsoft_client_secret,
        }}
      >
        <FormItem
          name="microsoft_client_id"
          rules={[{ required: true, message: 'Client ID is required' }]}
        >
          <Input type="text" placeholder="Client ID" />
        </FormItem>
        <FormItem
          name="microsoft_client_secret"
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
