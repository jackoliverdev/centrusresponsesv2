import { FunctionComponent, useCallback, useState } from 'react';
import { Button, Checkbox, Modal } from 'antd';
import { DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { useOrganization } from '@/hooks/admin/useOrganization';
import { Loading } from '@/components/common/Loading';
import { useUpdateOrganization } from '@/hooks/admin/useUpdateOrganization';
import { MicrosoftTeams } from '@/components/icons/MicrosoftTeams';
import { useMicrosoftAuth } from '@/hooks/integration/useMicrosoftAuth';
import { useSyncTeams } from '@/hooks/integration/useSyncTeams';
import { useTeamsChannels } from '@/hooks/integration/useTeamsChannels';
import Link from 'next/link';
import { USER_APP_ROUTES } from '@/routing/routes';
import { Badge } from '@/components/ui/badge';
import { Info, ExternalLink, LinkIcon } from 'lucide-react';

export type ConnectMicrosoftTeams = object;

export const ConnectMicrosoftTeams: FunctionComponent<
  ConnectMicrosoftTeams
> = () => {
  const [selectedChannels, setSelectedChannels] = useState<
    { teamId: string; channelId: string }[]
  >([]);
  const [infoVisible, setInfoVisible] = useState(false);
  
  const showInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInfoVisible(true);
  };

  const hideInfo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInfoVisible(false);
  };
  
  const { data: organization, isLoading: isLoadingOrganization } =
    useOrganization();

  const { mutate: syncTeams, isLoading: isLoadingSyncTeams } = useSyncTeams();
  const { mutate: microsoftAuth } = useMicrosoftAuth();
  const { mutate: updateOrganization, isLoading: isLoadingUpdateOrganization } =
    useUpdateOrganization();

  const { data: teamsChannels = [], isLoading: isLoadingTeamsChannels } =
    useTeamsChannels({ enabled: !!organization?.microsoft_token });

  const channelSelected = useCallback(
    (channelId: string) =>
      selectedChannels.some((c) => c.channelId === channelId),
    [selectedChannels],
  );

  const isLoading = isLoadingOrganization || isLoadingTeamsChannels;

  if (isLoading)
    return (
      <div className="group flex flex-col hover:shadow-sm transition-shadow border border-border bg-white rounded-md p-4 h-full">
        <Loading />
      </div>
    );

  if (organization?.microsoft_token)
    return (
      <div className="group flex flex-col hover:shadow-sm transition-shadow border border-border bg-white rounded-md p-4 h-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MicrosoftTeams className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl text-foreground font-bold">Microsoft Teams</h2>
          </div>
          <Badge className="bg-blue-600 text-white border-0 hover:bg-blue-600">
            Connected
          </Badge>
        </div>
        
        <p className="mt-2 text-sm text-muted-foreground">
          Import and sync conversations from your Microsoft Teams channels.<br />
          Select channels below to sync with Centrus.
        </p>
        
        <div className="flex-grow h-32 overflow-auto mt-3">
          {teamsChannels.length == 0 && (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="text-lg font-semibold text-neutral-400">
                No Channels
              </div>
            </div>
          )}
          {teamsChannels.map((channel) => (
            <Checkbox
              checked={channelSelected(channel.id)}
              onChange={(e) => {
                if (e.target.checked && !channelSelected(channel.id))
                  setSelectedChannels([
                    ...selectedChannels,
                    { teamId: channel.team.id, channelId: channel.id },
                  ]);
                else
                  setSelectedChannels(
                    selectedChannels.filter((c) => c.channelId !== channel.id),
                  );
              }}
              key={channel.id}
            >
              {channel.team.displayName} - {channel.displayName}
            </Checkbox>
          ))}
        </div>
        
        <div className="mt-6 flex gap-2">
          <button
            className={`w-1/2 bg-blue-600 ${selectedChannels.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'} text-white font-medium py-2 px-4 rounded flex items-center justify-center`}
            onClick={() => syncTeams(selectedChannels)}
            disabled={selectedChannels.length === 0 || isLoadingSyncTeams}
          >
            {isLoadingSyncTeams ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : (
              <SyncOutlined className="mr-2" />
            )}
            <span>Sync Channels</span>
          </button>
          <button
            className="w-1/2 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded flex items-center justify-center"
            onClick={() =>
              updateOrganization({
                microsoft_token: null,
              })
            }
            disabled={isLoadingUpdateOrganization}
          >
            <DeleteOutlined className="mr-2" />
            <span>Disconnect</span>
          </button>
        </div>
        
        <Modal
          title="How to use Microsoft Teams with Centrus"
          open={infoVisible}
          onCancel={() => hideInfo()}
          width={600}
          footer={[
            <Button key="close" onClick={() => hideInfo()}>
              Close
            </Button>,
          ]}
          maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        >
          <div className="text-sm mb-4" onClick={(e) => e.stopPropagation()}>
            <ol className="list-decimal pl-4 my-3 space-y-2">
              <li>Select Teams channels that contain conversations you want to reference</li>
              <li>Click "Sync" to import messages from selected channels into Centrus</li>
              <li>Messages are saved as a text document in your organisation's knowledge base</li>
              <li>Your AI can now reference these Teams conversations during chats</li>
              <li>Resync periodically to update with the latest conversations</li>
            </ol>
            <div className="mt-3">
              <p><strong>Supported content:</strong> Text messages from Teams channels are extracted and saved as a document</p>
              <p className="mt-2"><strong>Authentication:</strong> Microsoft Graph API is used to securely access your Teams data</p>
            </div>
          </div>
        </Modal>
      </div>
    );
    
  // For unconnected state, wrap the auth click in a separate handler function
  const handleAuth = (e: React.MouseEvent) => {
    e.stopPropagation();
    microsoftAuth();
  };
  
  return (
    <div 
      className="group flex flex-col hover:shadow-sm transition-shadow border border-border bg-white rounded-md p-4 h-full"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MicrosoftTeams className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl text-foreground font-bold">Microsoft Teams</h2>
        </div>
        <Badge className="bg-blue-600 text-white border-0 hover:bg-blue-600">
          Available
        </Badge>
      </div>
      
      <p className="mt-2 text-sm text-muted-foreground">
        Import and sync your Microsoft Teams conversations to use with Centrus AI.<br />
        Connect with Centrus to access your Teams channels securely.
      </p>
      
      <div className="flex-grow">
        <div className="text-sm text-muted-foreground mt-3">
          <ul className="list-disc ml-5 space-y-1 text-sm">
            <li>Import conversations from Teams channels</li>
            <li>Create AI-searchable knowledge from chats</li>
            <li>Keep your team's shared knowledge accessible</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 flex gap-2">
        <button
          className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
          onClick={handleAuth}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>Connect</span>
        </button>
        <button
          className="w-1/2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded flex items-center justify-center"
          onClick={showInfo}
        >
          <Info className="mr-2 h-4 w-4" />
          <span>Learn More</span>
        </button>
      </div>
      
      <Modal
        title="How to use Microsoft Teams with Centrus"
        open={infoVisible}
        onCancel={() => hideInfo()}
        width={600}
        footer={[
          <Button key="close" onClick={() => hideInfo()}>
            Close
          </Button>,
        ]}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      >
        <div className="text-sm mb-4" onClick={(e) => e.stopPropagation()}>
          <ol className="list-decimal pl-4 my-3 space-y-2">
            <li>Connect your Microsoft Teams account to grant Centrus secure access</li>
            <li>After connecting, you'll be able to select specific Teams channels to sync</li>
            <li>Centrus extracts text conversations from selected channels</li>
            <li>This data is saved as a text document for your AI to reference</li>
            <li>Your AI will be able to draw insights from your Teams conversations</li>
          </ol>
          <div className="mt-3">
            <p><strong>Data handling:</strong> Only text from messages is extracted, not files or other media</p>
            <p className="mt-2"><strong>Privacy:</strong> Centrus only processes channels you explicitly select</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
