import { FunctionComponent } from 'react';
import { AppLayout } from '../AppLayout';
import { Tabs } from 'antd';
import { FilesTab } from './FilesTab';
import router, { useRouter } from 'next/router';
import { USER_APP_ROUTES } from '@/routing/routes';
import { WebsitesTab } from './WebsitesTab';
import { IntegrationsTab } from './IntegrationsTab';
import { TextAudioTab } from '@/layouts/app/TrainLayout/TextAudioTab';

export type TrainLayoutProps = object;

export const TrainLayout: FunctionComponent<TrainLayoutProps> = () => {
  const {
    query: { id },
  } = useRouter();
  return (
    <AppLayout
      currentItemId="train"
      subtitle="Add data sources to train Centrus"
    >
      <div className="px-4">
        <Tabs
          items={[
            { label: 'Files', children: <FilesTab />, key: 'files' },
            {
              label: 'Integrations',
              children: <IntegrationsTab />,
              key: 'integrations',
            },
            { label: 'Websites', children: <WebsitesTab />, key: 'websites' },
            {
              label: 'Text / Audio',
              children: <TextAudioTab />,
              key: 'text-audio',
            },
          ]}
          activeKey={id?.toString() || 'files'}
          onChange={(key) => {
            switch (key) {
              case 'files':
                router.push(USER_APP_ROUTES.getPath('trainFiles'));
                break;
              case 'integrations':
                router.push(USER_APP_ROUTES.getPath('trainIntegrations'));
                break;
              case 'websites':
                router.push(USER_APP_ROUTES.getPath('trainWebsites'));
                break;
              case 'text-audio':
                router.push(USER_APP_ROUTES.getPath('trainTextAudio'));
                break;
            }
          }}
          size="large"
        />
      </div>
    </AppLayout>
  );
};
