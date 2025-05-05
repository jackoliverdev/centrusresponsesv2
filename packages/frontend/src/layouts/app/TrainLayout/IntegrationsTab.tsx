import { FunctionComponent } from 'react';
import { DocumentUsage } from './DocumentUsage';
import { ConnectGoogleDrive } from './ConnectGoogleDrive';
import { ConnectMicrosoftTeams } from './ConnectMicrosoftTeams';
import { CustomIntegrationCard } from './CustomIntegrationCard';

export type IntegrationsTabProps = object;

export const IntegrationsTab: FunctionComponent<IntegrationsTabProps> = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CustomIntegrationCard />
        <ConnectGoogleDrive />
        <ConnectMicrosoftTeams />
      </div>
      <DocumentUsage />
    </div>
  );
};
