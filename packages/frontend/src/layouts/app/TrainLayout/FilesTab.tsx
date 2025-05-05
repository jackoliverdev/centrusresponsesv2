import { Button, Divider, Dropdown, Popconfirm, message } from 'antd';
import { FunctionComponent, useMemo, useState, useCallback } from 'react';
import { Documents } from './Documents';
import { DocumentUsage } from './DocumentUsage';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { FileDropzone } from './FileDropzone';
import { ChevronDown, FileTextIcon, FolderIcon, Plus, PencilIcon, Trash2Icon, Tag, FolderPlus } from 'lucide-react';
import { useDocumentFolders } from '@/hooks/document/useDocumentFolders';
import { CreateDocumentFolderModal } from '@/components/app/Train/CreateDocumentFolderModal';
import { EditDocumentFolderMenu } from '@/components/app/Train/EditDocumentFolderMenu';
import { useDeleteDocumentFolder } from '@/hooks/document/useDeleteDocumentFolder';
import { useBulkAttachDocumentToFolder } from '@/hooks/document/useBulkAttachDocumentToFolder';
import { useBulkUpdateDocuments } from '@/hooks/document/useBulkUpdateDocuments';
import { useBulkDeleteDocuments } from '@/hooks/document/useBulkDeleteDocuments';
import { useTags } from '@/hooks/tags/useTags';
import { useAuthContext } from '@/context/AuthContext';
import { FolderWithDocumentsSchema } from 'common';
import { DataAccessTag } from '@/components/app/DataAccessTag';

export type FilesTabProps = object;

export const FilesTab: FunctionComponent<FilesTabProps> = () => {
  const { data: documents = [], isLoading: isLoadingDocuments } = useDocuments();
  const { data: folders = [], isLoading: isLoadingFolders, isError: isFoldersError } = useDocumentFolders();
  const [selectedFolderId, setSelectedFolderId] = useState<number>();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isFoldersCollapsed, setIsFoldersCollapsed] = useState(true);
  const [isDocumentsCollapsed, setIsDocumentsCollapsed] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<number>();
  const { isOrgAdmin, isPlatformAdmin, user } = useAuthContext();
  const { mutate: deleteFolder, isLoading: isDeleting } = useDeleteDocumentFolder();
  const { data: tags = [] } = useTags();
  const { mutate: bulkAttachToFolder } = useBulkAttachDocumentToFolder();
  const { mutate: bulkUpdate } = useBulkUpdateDocuments();
  const { mutate: bulkDelete } = useBulkDeleteDocuments();

  const filteredDocuments = useMemo(() => {
    if (selectedFolderId) {
      const folder = folders.find(f => f.id === selectedFolderId);
      if (folder) {
        const documentIds = folder.documents.map(doc => doc.id);
        return documents.filter(doc => documentIds.includes(doc.id));
      }
    }
    return documents.filter((doc) => doc.type === 'text' || doc.type === 'audio');
  }, [documents, folders, selectedFolderId]);

  const handleSelectAll = useCallback(() => {
    if (selectedDocumentIds.size === filteredDocuments.length) {
      setSelectedDocumentIds(new Set());
    } else {
      setSelectedDocumentIds(new Set(filteredDocuments.map(doc => doc.id)));
    }
  }, [filteredDocuments, selectedDocumentIds]);

  const handleDocumentSelect = useCallback((documentId: string, selected: boolean) => {
    setSelectedDocumentIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(documentId);
      } else {
        next.delete(documentId);
      }
      return next;
    });
  }, []);

  const handleFolderDelete = useCallback((folderId: number) => {
    deleteFolder(
      { id: folderId },
      {
        onSuccess: () => {
          if (selectedFolderId === folderId) {
            setSelectedFolderId(undefined);
          }
          setDeletingFolderId(undefined);
          message.success("Folder deleted successfully");
        },
        onError: () => {
          setDeletingFolderId(undefined);
          message.error("Failed to delete folder");
        }
      }
    );
  }, [deleteFolder, selectedFolderId]);

  const canUpdateFolder = useCallback((folder: FolderWithDocumentsSchema) => {
    const isMine = user?.id === folder.userId;
    return isMine || (folder.global && (isOrgAdmin || isPlatformAdmin));
  }, [user, isOrgAdmin, isPlatformAdmin]);

  const handleBulkAddToFolder = useCallback((folderId: number) => {
    if (!selectedDocumentIds.size) return;
    if (!user?.id || !user?.activeOrganizationId) {
      message.error('User context not available');
      return;
    }

    bulkAttachToFolder(
      { 
        documentIds: Array.from(selectedDocumentIds), 
        folderId,
        organizationId: user.activeOrganizationId,
        userId: user.id,
      },
      {
        onSuccess: () => {
          message.success(`Added ${selectedDocumentIds.size} documents to folder`);
          setSelectedDocumentIds(new Set());
        },
        onError: () => {
          message.error('Failed to add documents to folder');
        }
      }
    );
  }, [bulkAttachToFolder, selectedDocumentIds, user]);

  const handleBulkTag = useCallback((tag: any) => {
    if (!selectedDocumentIds.size) return;
    
    bulkUpdate(
      {
        ids: Array.from(selectedDocumentIds),
        data: {},
        tagData: tag
      },
      {
        onSuccess: () => {
          setSelectedDocumentIds(new Set());
          message.success(`Updated ${selectedDocumentIds.size} documents`);
        },
        onError: () => {
          message.error('Failed to update documents');
          return;
        }
      }
    );
  }, [bulkUpdate, selectedDocumentIds]);

  const handleBulkDelete = useCallback(() => {
    if (!selectedDocumentIds.size) return;

    bulkDelete(
      { ids: Array.from(selectedDocumentIds) },
      {
        onSuccess: () => {
          setSelectedDocumentIds(new Set());
          message.success(`Deleted ${selectedDocumentIds.size} documents`);
        },
        onError: () => {
          message.error('Failed to delete documents');
          return;
        }
      }
    );
  }, [bulkDelete, selectedDocumentIds]);

  const actionItems = useMemo(() => [
    {
      key: 'tagSubmenu',
      label: 'Apply Tag',
      icon: <Tag className="h-4 w-4" />,
      children: tags.map(tag => ({
        key: `tag-${tag.id}`,
        label: <DataAccessTag tag={tag} />,
        onClick: () => handleBulkTag(tag)
      }))
    },
    {
      key: 'folderSubmenu',
      label: 'Add to folder',
      icon: <FolderPlus className="h-4 w-4" />,
      children: folders.map(folder => ({
        key: `folder-${folder.id}`,
        label: (
          <div className="flex items-center gap-2">
            <FolderIcon className="h-4 w-4" style={{ color: folder.color }} />
            <span>{folder.name}</span>
          </div>
        ),
        onClick: () => handleBulkAddToFolder(folder.id)
      }))
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2Icon className="h-4 w-4" />,
      danger: true,
      onClick: handleBulkDelete
    }
  ], [folders, tags, handleBulkTag, handleBulkAddToFolder, handleBulkDelete]);

  return (
    <div className="space-y-6">
      <FileDropzone />
      
      {/* Folder Section with Collapsible Header */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div 
          className="flex items-center justify-between px-4 py-2 bg-white cursor-pointer"
          onClick={() => setIsFoldersCollapsed(!isFoldersCollapsed)}
        >
          <div className="flex items-center gap-2 text-gray-700">
            <FolderIcon className="h-4 w-4" />
            <h2 className="text-base font-semibold">
              Folders
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              size="small"
              className="h-6 px-2 flex items-center text-xs"
              icon={<Plus className="h-3 w-3 mr-1" />}
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingFolder(true);
              }}
            >
              Create
            </Button>
            <Button
              type="text"
              size="small"
              className="h-6 w-6 p-0"
              icon={<ChevronDown className={`w-4 h-4 transition-transform ${isFoldersCollapsed ? 'rotate-180' : ''}`} />}
            />
          </div>
        </div>
        {!isFoldersCollapsed && (
          <div className="px-4 py-2 bg-white border-t">
            {isLoadingFolders ? (
              <div className="text-center text-sm text-gray-500 py-3">
                Loading folders...
              </div>
            ) : isFoldersError ? (
              <div className="text-center text-sm text-red-500 py-3">
                Error loading folders
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-3">
                No folders yet
              </div>
            ) : (
              <div className="space-y-1 py-1">
                {folders.map(folder => (
                  <div 
                    key={folder.id}
                    className="group flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-100"
                  >
                    <div 
                      className={`flex-1 flex items-center gap-2 ${selectedFolderId === folder.id ? 'text-blue-600' : ''}`}
                      onClick={() => setSelectedFolderId(folder.id)}
                    >
                      <FolderIcon className="h-4 w-4 text-gray-500" style={{ color: folder.color }} />
                      <span className="text-sm">{folder.name}</span>
                      <span className="text-xs text-gray-500 ml-auto">{folder.documents.length}</span>
                    </div>
                    {canUpdateFolder(folder) && (
                      <div className="flex items-center">
                        <EditDocumentFolderMenu folder={folder} />
                        {deletingFolderId === folder.id ? (
                          <Popconfirm
                            title="Delete this folder?"
                            description="Documents won't be deleted."
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            cancelText="Cancel"
                            open={deletingFolderId === folder.id}
                            onConfirm={() => handleFolderDelete(folder.id)}
                            onCancel={() => setDeletingFolderId(undefined)}
                            placement="bottomRight"
                            okType="danger"
                          >
                            <Button
                              type="text"
                              className="text-red-500 hover:text-red-700 ml-1 p-1 h-auto"
                              loading={isDeleting}
                              disabled={isDeleting}
                              icon={<Trash2Icon className="h-3.5 w-3.5" />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        ) : (
                          <Button
                            type="text"
                            className="text-gray-500 hover:text-red-700 ml-1 p-1 h-auto"
                            icon={<Trash2Icon className="h-3.5 w-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingFolderId(folder.id);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedFolderId && (
        <div className="px-4">
          <Button
            type="text"
            size="small"
            className="text-red-400 hover:!text-red-500 text-xs h-6"
            onClick={() => setSelectedFolderId(undefined)}
          >
            Clear folder filter
          </Button>
        </div>
      )}
      
      {/* Documents Section with Collapsible Header */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 bg-white">
          <div className="flex items-center gap-2 text-gray-700">
            <FileTextIcon className="h-4 w-4" />
            <h2 className="text-base font-semibold">
              {selectedFolderId 
                ? `Documents in folder (${filteredDocuments.length})` 
                : 'All uploaded documents'}
            </h2>
          </div>
          <Button
            type="text"
            size="small"
            className="h-6 w-6 p-0"
            onClick={() => setIsDocumentsCollapsed(!isDocumentsCollapsed)}
            icon={<ChevronDown className={`w-4 h-4 transition-transform ${isDocumentsCollapsed ? 'rotate-180' : ''}`} />}
          />
        </div>
        {!isDocumentsCollapsed && (
          <div className="px-4 py-3 bg-white border-t">
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="small"
                className="text-xs border rounded h-6 px-2"
                onClick={handleSelectAll}
              >
                {selectedDocumentIds.size === filteredDocuments.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedDocumentIds.size > 0 && (
                <>
                  <span className="text-blue-600 text-xs">Selected: {selectedDocumentIds.size}</span>
                  <Dropdown menu={{ items: actionItems }} trigger={['click']}>
                    <Button type="primary" size="small" className="h-6 px-2 text-xs">
                      Actions <ChevronDown className="h-3 w-3 ml-1 inline-block" />
                    </Button>
                  </Dropdown>
                </>
              )}
            </div>
            <Documents 
              documents={filteredDocuments} 
              loading={isLoadingDocuments}
              selectedDocumentIds={selectedDocumentIds}
              onDocumentSelect={handleDocumentSelect}
            />
          </div>
        )}
      </div>

      {/* Document Usage at the bottom */}
      <DocumentUsage />

      <CreateDocumentFolderModal
        open={isCreatingFolder}
        onClose={() => setIsCreatingFolder(false)}
      />
    </div>
  );
};
