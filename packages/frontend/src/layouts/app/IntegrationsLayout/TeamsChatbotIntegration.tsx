import { FunctionComponent } from 'react';
import { Heading } from './Heading';
import { Button, Form, Input } from 'antd';
import { useUpdateOrganization } from '@/hooks/admin/useUpdateOrganization';
import { useOrganization } from '@/hooks/admin/useOrganization';
import { MicrosoftTeams } from '@/components/icons/MicrosoftTeams';

export type TeamsChatbotIntegrationProps = object;

type FormType = {
  url: string;
};
const FormItem = Form.Item<FormType>;
export const TeamsChatbotIntegration: FunctionComponent<
  TeamsChatbotIntegrationProps
> = () => {
  const [form] = Form.useForm<FormType>();
  const { data: organization } = useOrganization();
  const { mutate: update, isLoading } = useUpdateOrganization();
  return (
    <div>
      <Heading>
        <MicrosoftTeams className="size-6" /> Teams Chatbot URL
      </Heading>
      <Form
        form={form}
        onFinish={({ url }) => {
          update({
            teams_bot_url: url,
          });
        }}
        initialValues={{
          url: organization?.teams_bot_url,
        }}
      >
        <FormItem
          name="url"
          rules={[
            { required: true, message: 'URL is required' },
            {
              type: 'url',
              message: 'Not a valid URL',
            },
          ]}
        >
          <Input type="text" placeholder="Enter your MS Teams Chatbot URL" />
        </FormItem>
        <Button type="primary" loading={isLoading} htmlType="submit">
          Save
        </Button>
      </Form>
    </div>
  );
};
