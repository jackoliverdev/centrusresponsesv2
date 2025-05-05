import { FunctionComponent, useMemo, useState } from 'react';
import { Button, Tree, Modal } from 'antd';
import {
  DeleteOutlined,
  FolderOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { GoogleDrive } from '@/components/icons/GoogleDrive';
import { useGoogleAuth } from '@/hooks/integration/useGoogleAuth';
import { useDriveFolders } from '@/hooks/integration/useDriveFolders';
import { useOrganization } from '@/hooks/admin/useOrganization';
import { useSyncDrive } from '@/hooks/integration/useSyncDrive';
import { Loading } from '@/components/common/Loading';
import { useUpdateOrganization } from '@/hooks/admin/useUpdateOrganization';
import Link from 'next/link';
import { USER_APP_ROUTES } from '@/routing/routes';
import { Badge } from '@/components/ui/badge';
import { Info, ExternalLink, LinkIcon } from 'lucide-react';

export type ConnectGoogleDriveProps = object;

export const ConnectGoogleDrive: FunctionComponent<
  ConnectGoogleDriveProps
> = () => {
  const { data: organization, isLoading: isLoadingOrganization } =
    useOrganization();
  const { data: folders = [], isLoading: isLoadingDriveFolders } =
    useDriveFolders();

  const { mutate: syncDrive, isLoading: isLoadingSyncDrive } = useSyncDrive();
  const { mutate: googleAuth } = useGoogleAuth();
  const { mutate: updateOrganization, isLoading: isLoadingUpdateOrganization } =
    useUpdateOrganization();

  const [folderId, setFolderId] = useState<string>();
  const [infoVisible, setInfoVisible] = useState(false);
  
  const showInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInfoVisible(true);
  };

  const hideInfo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInfoVisible(false);
  };

  const isLoading = isLoadingDriveFolders || isLoadingOrganization;

  const tree = useMemo(() => {
    interface TreeNode {
      title: string;
      key: string;
      children: TreeNode[];
    }
    const folderMap = new Map<string, TreeNode>();

    folders.forEach((folder) => {
      folderMap.set(folder.id, {
        title: folder.name,
        key: folder.id,
        children: [],
      });
    });

    const rootFolders: TreeNode[] = [];

    folders.forEach((folder) => {
      const parentId = folder.parents?.[0];
      const currentNode = folderMap.get(folder.id)!;

      if (!parentId || !folderMap.has(parentId)) {
        rootFolders.push(currentNode);
      } else {
        const parentNode = folderMap.get(parentId);
        if (parentNode) {
          parentNode.children.push(currentNode);
        }
      }
    });

    return rootFolders;
  }, [folders]);

  if (isLoading)
    return (
      <div className="group flex flex-col hover:shadow-sm transition-shadow border border-border bg-white rounded-md p-4 h-full">
        <Loading />
      </div>
    );
    
  if (organization?.google_token)
    return (
      <div className="group flex flex-col hover:shadow-sm transition-shadow border border-border bg-white rounded-md p-4 h-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GoogleDrive className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl text-foreground font-bold">Google Drive</h2>
          </div>
          <Badge className="bg-blue-600 text-white border-0">
            Connected
          </Badge>
        </div>
        
        <p className="mt-2 text-sm text-muted-foreground">
          Import and sync documents from your Google Drive folders.<br />
          Select folders below and sync them to Centrus.
        </p>
        
        <div className="flex-grow h-32 overflow-auto mt-3">
          {folders.length == 0 && (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="text-lg font-semibold text-neutral-400">
                No Folders
              </div>
            </div>
          )}
          <Tree
            className="w-fit"
            treeData={tree}
            showIcon={true}
            icon={<FolderOutlined />}
            selectedKeys={[folderId || '']}
            onSelect={(keys) => {
              const key = keys[0];
              key && typeof key == 'string' && setFolderId(key);
            }}
            multiple={false}
          />
        </div>
        
        <div className="mt-6 flex gap-2">
          <button
            className={`w-1/2 bg-blue-600 ${!folderId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'} text-white font-medium py-2 px-4 rounded flex items-center justify-center`}
            onClick={() => folderId && syncDrive({ folderId })}
            disabled={!folderId || isLoadingSyncDrive}
          >
            {isLoadingSyncDrive ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : (
              <SyncOutlined className="mr-2" />
            )}
            <span>Sync Folder</span>
          </button>
          <button
            className="w-1/2 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded flex items-center justify-center"
            onClick={() =>
              updateOrganization({
                google_token: null,
                drive_folder_id: '',
              })
            }
            disabled={isLoadingUpdateOrganization}
          >
            <DeleteOutlined className="mr-2" />
            <span>Disconnect</span>
          </button>
        </div>
        
        <Modal
          title="How to use Google Drive with Centrus"
          open={infoVisible}
          onCancel={(e) => hideInfo()}
          width={600}
          footer={[
            <Button key="close" onClick={(e) => hideInfo()}>
              Close
            </Button>,
          ]}
          maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        >
          <div className="text-sm mb-4">
            <ol className="list-decimal pl-4 my-3 space-y-2">
              <li>Select specific folders from your Google Drive that contain documents you want to use</li>
              <li>Click "Sync" to import those documents into Centrus</li>
              <li>Your documents will become available for AI to reference during conversations</li>
              <li>Resync your folder whenever you add new documents you want Centrus to access</li>
              <li>All document types including Google Docs, Sheets, PDFs and Office files are supported</li>
            </ol>
            <div className="mt-3">
              <p><strong>Privacy note:</strong> Centrus only accesses files you explicitly allow by selecting specific folders</p>
            </div>
          </div>
        </Modal>
      </div>
    );
    
  // For unconnected state, wrap the auth click in a separate handler function
  const handleAuth = (e: React.MouseEvent) => {
    e.stopPropagation();
    googleAuth();
  };
  
  return (
    <div 
      className="group flex flex-col hover:shadow-sm transition-shadow border border-border bg-white rounded-md p-4 h-full"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <GoogleDrive className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl text-foreground font-bold">Google Drive</h2>
        </div>
        <Badge className="bg-blue-600 text-white border-0 hover:bg-blue-600">
          Available
        </Badge>
      </div>
      
      <p className="mt-2 text-sm text-muted-foreground">
        Import and sync your Google Drive documents to use with Centrus AI.<br />
        Connect with Centrus to access your files securely.
      </p>
      
      <div className="flex-grow">
        <div className="text-sm text-muted-foreground mt-3">
          <ul className="list-disc ml-5 space-y-1 text-sm">
            <li>Import documents from Google Drive</li>
            <li>Sync specific folders for AI analysis</li>
            <li>Keep your knowledge base up to date</li>
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
        title="How to use Google Drive with Centrus"
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
            <li>Connect your Google Drive account to give Centrus access to your documents</li>
            <li>Select specific folders you want to sync with Centrus</li>
            <li>Your documents will become available for AI to reference during conversations</li>
            <li>Sync folders whenever you add new documents you want Centrus to access</li>
            <li>All document types including Google Docs, Sheets, PDFs and Office files are supported</li>
          </ol>
          <div className="mt-3">
            <p><strong>Privacy note:</strong> Centrus only accesses files you explicitly allow by selecting specific folders</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
