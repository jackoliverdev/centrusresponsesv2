import { NextPage } from 'next';
import { AppLayout } from '@/layouts/app/AppLayout';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Button, Modal, message, Input, Select, Tooltip } from 'antd';
import { Plus, Loader2, Trash2, User, Globe, AlertTriangle, Users, PlayCircle, Copy } from 'lucide-react';
import { useAgentInstances } from '@/hooks/useAgentInstances';
import { useAgents } from '@/hooks/useAgents';
import { USER_APP_ROUTES } from '@/routing/routes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import CreateAgentInstanceModal from '@/components/app/Agents/CreateAgentInstanceModal';
import { useQuery } from 'react-query';
import { getAPI } from '@/utils/api';
import React from 'react';
import { API, createAgentInstance as createAgentInstanceEndpoint } from 'common';
import { Badge } from '@/components/ui/badge';
import { FilterOutlined, SearchOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';

type FilterType = 'all' | 'personal' | 'shared' | 'org';
type SortField = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const MessageGeneratorPage: NextPage = () => {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [instanceToDelete, setInstanceToDelete] = useState<{ id: string, name: string } | null>(null);
  const [nonCreatorModal, setNonCreatorModal] = useState<{ id: string, name: string, creatorName: string } | null>(null);
  const agentType = "message_generator";
  
  // Filter and sort states
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: agents } = useAgents();
  const agent = agents?.find(a => a.type === agentType);
  
  const { instances, deleteInstance } = useAgentInstances(agentType);
  const { data: instancesData, isLoading, refetch } = instances;
  
  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useQuery('currentUser', async () => {
    const { post } = getAPI();
    return await post(API.getOrCreateUser);
  });
  
  // Filter instances based on visibility (personal ones created by this user or org-visible ones)
  const baseFilteredInstances = React.useMemo(() => {
    if (!instancesData || !currentUser) return [];
    
    console.log('Current user ID:', currentUser.id);
    console.log('Available instances:', instancesData);
    
    return instancesData.filter(instance => {
      const isCreatedByCurrentUser = instance.createdBy === currentUser.id;
      const isSharedWithCurrentUser = instance.isShared && instance.visibleToUsers?.includes(currentUser.id);
      
      console.log(`Instance ${instance.id} created by ${instance.createdBy}, visible to org: ${instance.isOrgVisible}, shared: ${instance.isShared}, current user: ${currentUser.id}, matches: ${isCreatedByCurrentUser || instance.isOrgVisible || isSharedWithCurrentUser}`);
      
      return instance.isOrgVisible || isCreatedByCurrentUser || isSharedWithCurrentUser;
    });
  }, [instancesData, currentUser]);
  
  // Apply user filters (by type, search, visibility)
  const filteredInstances = useMemo(() => {
    if (!baseFilteredInstances || !currentUser) return [];
    
    return baseFilteredInstances
      // Apply search filter
      .filter(instance => {
        if (!searchText) return true;
        return instance.name.toLowerCase().includes(searchText.toLowerCase()) ||
              (instance.instructions || '').toLowerCase().includes(searchText.toLowerCase());
      })
      // Apply type/visibility filters
      .filter(instance => {
        const isCreatedByCurrentUser = instance.createdBy === currentUser.id;
        const isSharedWithCurrentUser = instance.isShared && instance.visibleToUsers?.includes(currentUser.id);
        
        // Apply filter type (category filter)
        if (filterType === 'personal') return isCreatedByCurrentUser && !instance.isOrgVisible && !isSharedWithCurrentUser;
        if (filterType === 'shared') return isSharedWithCurrentUser && !instance.isOrgVisible;
        if (filterType === 'org') return instance.isOrgVisible;
        
        return true; // 'all' filter type shows everything
      })
      // Apply sorting
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        } else { // createdAt
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
      });
  }, [baseFilteredInstances, filterType, searchText, sortField, sortOrder, currentUser]);

  const confirmDelete = (instance: any) => {
    // Check if current user is the creator of this instance
    if (currentUser && instance.createdBy === currentUser.id) {
      setInstanceToDelete({ id: instance.id.toString(), name: instance.name });
    } else {
      // Find the creator's information from users table
      const findCreator = async () => {
        try {
          const { post } = getAPI();
          // Get all users in the organization
          const response = await post(API.getUsers);
          
          // Handle pagination result structure if present
          const users = Array.isArray(response) ? response : 
                       (response && 'data' in response ? response.data : []);
          
          // Find the user that matches the creator ID
          const creator = users.find((user: any) => user.id === instance.createdBy);
          
          // Get creator name or default to "the creator" if not found
          const creatorName = creator 
            ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.email
            : "the creator";
          
          setNonCreatorModal({ 
            id: instance.id.toString(), 
            name: instance.name,
            creatorName
          });
        } catch (error) {
          console.error("Error fetching creator info:", error);
          // Fallback if we can't get user info
          setNonCreatorModal({ 
            id: instance.id.toString(), 
            name: instance.name,
            creatorName: "the creator"
          });
        }
      };
      
      findCreator();
    }
  };

  const handleDeleteInstance = async () => {
    if (!instanceToDelete) return;
    
    setDeleting(instanceToDelete.id);
    try {
      await deleteInstance.mutateAsync(instanceToDelete.id);
      await refetch();
      message.success({
        content: (
          <div className="flex items-center">
            <Trash2 className="h-4 w-4 mr-2" />
            <span>Agent instance deleted successfully</span>
          </div>
        ),
        duration: 3
      });
    } catch (error) {
      console.error('Failed to delete instance:', error);
      message.error('Failed to delete instance');
    } finally {
      setDeleting(null);
      setInstanceToDelete(null);
    }
  };

  const handleConfigureInstance = (instanceId: string) => {
    router.push(USER_APP_ROUTES.getPath('agentInstance', { 
      type: agentType, 
      instanceId 
    }));
  };

  const handleDuplicateInstance = async (instance: any) => {
    setDuplicating(instance.id.toString());
    try {
      // Create a new instance with data from the current one
      const newInstance = {
        ...instance,
        name: `${instance.name} (Copy)`,
        id: undefined, // Remove ID so a new one is generated
        createdAt: undefined,
        updatedAt: undefined
      };
      
      // Call create instance API
      const { post } = getAPI();
      await post(createAgentInstanceEndpoint, {
        agentId: instance.agentId,
        name: newInstance.name,
        instructions: newInstance.instructions || '',
        context: newInstance.context || '',
        isOrgVisible: false, // Default to private for copies
        isReadOnly: false
      });
      
      // Refresh the list
      await refetch();
      message.success({
        content: (
          <div className="flex items-center">
            <Copy className="h-4 w-4 mr-2" />
            <span>Agent instance duplicated successfully</span>
          </div>
        ),
        duration: 3
      });
    } catch (error) {
      console.error('Failed to duplicate instance:', error);
      message.error('Failed to duplicate instance');
    } finally {
      setDuplicating(null);
    }
  };

  const backToAgents = (
    <ShadcnButton
      variant="outline"
      onClick={() => router.push(USER_APP_ROUTES.getPath('agents'))}
    >
      Back to Agents
    </ShadcnButton>
  );

  const newInstanceButton = (
    <Button 
      type="primary"
      onClick={() => setCreateModalOpen(true)}
      icon={<Plus className="h-4 w-4 mr-2" />}
    >
      New Instance
    </Button>
  );

  // Reset all filters to default
  const resetFilters = () => {
    setFilterType('all');
    setSearchText('');
    setSortField('createdAt');
    setSortOrder('desc');
  };

  if (isLoadingUser) {
    return (
      <AppLayout 
        currentItemId="agents"
        subtitle="Loading user data..."
      >
        <div className="container py-0 flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      currentItemId="agents"
      subtitle={agent?.description || 'Generate customised messages for various platforms'}
      action={
        <div className="flex gap-2">
          {backToAgents}
          {newInstanceButton}
        </div>
      }
    >
      <div className="container py-0">
        {/* Filter and Search Bar */}
        <div className="mb-4">
          {/* Desktop View - Single Line */}
          <div className="hidden sm:flex gap-2 items-center">
            <Input
              placeholder="Search by name or instructions..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              style={{ width: 600, height: 32 }}
            />
            
            <Select
              value={filterType}
              onChange={(value: FilterType) => setFilterType(value)}
              style={{ width: 140, height: 32 }}
              options={[
                { label: 'All Instances', value: 'all' },
                { label: 'Personal', value: 'personal' },
                { label: 'Shared', value: 'shared' },
                { label: 'Organisation', value: 'org' }
              ]}
              suffixIcon={<FilterOutlined className="text-gray-400" />}
              dropdownMatchSelectWidth={false}
            />
            
            <Select
              value={sortField}
              onChange={(value: SortField) => setSortField(value)}
              style={{ width: 140, height: 32 }}
              options={[
                { label: 'Name', value: 'name' },
                { label: 'Date Created', value: 'createdAt' }
              ]}
              dropdownMatchSelectWidth={false}
            />
            
            <Tooltip title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}>
              <Button 
                icon={sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />} 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
            
            {(filterType !== 'all' || searchText || 
              sortField !== 'createdAt' ||
              sortOrder !== 'desc') && (
              <Button 
                type="link" 
                onClick={resetFilters}
                style={{ height: 32, padding: '4px 11px' }}
              >
                Clear filters
              </Button>
            )}
            
            <span className="text-sm text-muted-foreground ml-2">
              {filteredInstances.length} {filteredInstances.length === 1 ? 'instance' : 'instances'} found
              {filterType !== 'all' && ` · ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} instances`}
              {searchText && ` · Search: "${searchText}"`}
            </span>
          </div>
          
          {/* Mobile View - Stacked Layout */}
          <div className="flex flex-col gap-2 sm:hidden">
            {/* Search Bar */}
            <Input
              placeholder="Search by name or instructions..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              style={{ height: 32 }}
            />
            
            {/* Filter Controls Row */}
            <div className="flex items-center gap-1">
              <Select
                value={filterType}
                onChange={(value: FilterType) => setFilterType(value)}
                style={{ height: 32 }}
                className="flex-1"
                options={[
                  { label: 'All Instances', value: 'all' },
                  { label: 'Personal', value: 'personal' },
                  { label: 'Shared', value: 'shared' },
                  { label: 'Organisation', value: 'org' }
                ]}
                suffixIcon={<FilterOutlined className="text-gray-400" />}
                dropdownMatchSelectWidth={false}
              />
              
              <Select
                value={sortField}
                onChange={(value: SortField) => setSortField(value)}
                style={{ height: 32 }}
                className="flex-1"
                options={[
                  { label: 'Date Created', value: 'createdAt' },
                  { label: 'Name', value: 'name' }
                ]}
                dropdownMatchSelectWidth={false}
              />
              
              <Tooltip title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}>
                <Button 
                  icon={sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />} 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Tooltip>
            </div>
            
            {/* Results and Clear Filters */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {filteredInstances.length} {filteredInstances.length === 1 ? 'instance' : 'instances'} found
              </span>
              
              {(filterType !== 'all' || searchText || 
                sortField !== 'createdAt' ||
                sortOrder !== 'desc') && (
                <Button 
                  type="link" 
                  onClick={resetFilters}
                  style={{ height: 32, padding: '4px 0' }}
                  size="small"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-[250px] flex flex-col">
                <CardHeader className="pb-2 pt-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="flex-grow py-2">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </CardContent>
                <CardFooter className="pt-2 pb-4">
                  <div className="h-9 bg-gray-200 rounded w-full"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredInstances.length > 0 ? (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            {filteredInstances.map((instance) => (
              <Card key={instance.id} className="flex flex-col h-full min-h-[260px] bg-white border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                    <CardTitle className="text-base sm:text-lg font-semibold mr-2 break-words truncate max-w-full" style={{ wordBreak: 'break-word' }}>{instance.name}</CardTitle>
                    <Badge 
                      variant={instance.isOrgVisible ? 'secondary' : (instance.isShared ? 'outline' : 'default')}
                      className="self-start sm:self-auto whitespace-nowrap"
                    >
                      {instance.isOrgVisible ? 
                        <>{instance.isReadOnly ? 
                          <><Globe className="h-3 w-3 mr-1" /> Org (Read-only)</> : 
                          <><Globe className="h-3 w-3 mr-1" /> Org (Editable)</>
                        }</> : 
                        instance.isShared ?
                        <><Users className="h-3 w-3 mr-1" /> Shared</> :
                        <><User className="h-3 w-3 mr-1" /> Personal</>
                      }
                    </Badge>
                  </div>
                  <CardDescription className="truncate text-xs sm:text-sm mt-1">
                    Created {new Date(instance.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow py-2 flex flex-col justify-between">
                  <div>
                    {/* Display platform type if available */}
                    {(() => {
                      try {
                        if (instance.context) {
                          const contextData = JSON.parse(instance.context);
                          if (contextData.platformType) {
                            return (
                              <div className="mb-2">
                                <span className="font-bold">Platform: </span>
                                <span className="text-sm capitalize">
                                  {contextData.platformType === 'generic' ? 'Generic' : contextData.platformType}
                                </span>
                              </div>
                            );
                          }
                        }
                        // Show Generic when no platform is defined
                        return (
                          <div className="mb-2">
                            <span className="font-bold">Platform: </span>
                            <span className="text-sm">Generic</span>
                          </div>
                        );
                      } catch (e) {
                        // Show Generic if there's an error parsing context
                        return (
                          <div className="mb-2">
                            <span className="font-bold">Platform: </span>
                            <span className="text-sm">Generic</span>
                          </div>
                        );
                      }
                    })()}
                    <div className="mt-1">
                      <span className="font-bold">Instructions: </span>
                      {instance.instructions 
                        ? (
                          <span className="text-sm truncate-2-lines break-words max-w-full block">
                            {instance.instructions}
                          </span>
                        ) 
                        : <span className="text-amber-600 font-bold">Instructions not defined</span>}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between pt-2 pb-4 mt-auto gap-2">
                  <ShadcnButton 
                    variant="default" 
                    onClick={() => handleConfigureInstance(instance.id.toString())}
                    className="w-full sm:w-auto flex-grow sm:flex-grow-0 mr-0 sm:mr-2 text-base sm:text-sm py-2 sm:py-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Use Agent
                  </ShadcnButton>
                  <div className="flex flex-row gap-2 w-full sm:w-auto">
                    <ShadcnButton 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDuplicateInstance(instance)}
                      disabled={duplicating === instance.id.toString()}
                      className="border-blue-500 flex-1 min-w-0"
                    >
                      {duplicating === instance.id.toString() ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4 text-blue-500" />
                      )}
                    </ShadcnButton>
                    <ShadcnButton 
                      variant="outline" 
                      size="icon" 
                      onClick={() => confirmDelete(instance)}
                      disabled={deleting === instance.id.toString()}
                      className="border-red-500 flex-1 min-w-0"
                    >
                      {deleting === instance.id.toString() ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </ShadcnButton>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg">
            {searchText || filterType !== 'all' ? (
              <>
                <h3 className="text-lg font-medium mb-2">No matching instances found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={resetFilters}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No instances created yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first instance to get started with message generation
                </p>
                <Button 
                  type="primary"
                  onClick={() => setCreateModalOpen(true)}
                  icon={<Plus className="h-4 w-4 mr-2" />}
                >
                  Create Instance
                </Button>
              </>
            )}
          </div>
        )}

        <CreateAgentInstanceModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          agentId={agent?.id?.toString() || ""}
          agentType={agentType}
        />
        
        <Modal
          title={
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Deletion
            </div>
          }
          open={!!instanceToDelete}
          onCancel={() => setInstanceToDelete(null)}
          footer={[
            <Button key="cancel" onClick={() => setInstanceToDelete(null)}>
              Cancel
            </Button>,
            <Button 
              key="delete" 
              danger 
              type="primary" 
              onClick={handleDeleteInstance}
              loading={!!deleting}
            >
              Delete
            </Button>,
          ]}
        >
          <p className="mb-4">Are you sure you want to delete <strong>{instanceToDelete?.name}</strong>?</p>
          <p className="text-red-500">This action cannot be undone.</p>
        </Modal>
        
        <Modal
          title={
            <div className="flex items-center text-amber-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Permission Required
            </div>
          }
          open={!!nonCreatorModal}
          onCancel={() => setNonCreatorModal(null)}
          footer={[
            <Button key="ok" type="primary" onClick={() => setNonCreatorModal(null)}>
              OK
            </Button>,
          ]}
        >
          <p className="mb-4">
            You don't have permission to delete <strong>{nonCreatorModal?.name}</strong>.
          </p>
          <p className="mb-4">
            Only the creator of this agent instance can delete it. Please contact <strong>{nonCreatorModal?.creatorName}</strong> to request deletion.
          </p>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default MessageGeneratorPage; 