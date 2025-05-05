import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AgentInstanceSchema, getAgentInstances, createAgentInstance as createAgentInstanceEndpoint, deleteAgentInstance as deleteAgentInstanceEndpoint, updateAgentInstance as updateAgentInstanceEndpoint, getAgentInstanceUserVisibility, updateAgentInstanceVisibility, updateAgentInstanceUserFieldPermission, AgentInstanceFieldPermissionSchema, updateAgentInstanceUserPermission, getAgentInstanceOrganizationVisibility, createAgentInstanceOrganizationVisibility, updateAgentInstanceOrganizationPermission, getAgentInstanceOrganizationFieldPermissions, createAgentInstanceOrganizationFieldPermission, updateAgentInstanceOrganizationFieldPermission, deleteAgentInstanceOrganizationFieldPermission } from 'common';
import { getAPI } from '@/utils/api';
import { useAgents } from './useAgents';

// Extend the AgentInstanceSchema to include visibleToUsers
export interface AgentInstance extends AgentInstanceSchema {
  visibleToUsers?: number[];
  isShared?: boolean;
}

// Interface for user visibility with permissions
export interface UserVisibility {
  userId: number;
  instanceId: number;
  isReadOnly: boolean;
}

// Interface for organization visibility with permissions
export interface OrganizationVisibility {
  organizationId: number;
  instanceId: number;
  isReadOnly: boolean;
}

// Create a type for the createAgentInstance parameters to include visibleToUsers
interface CreateAgentInstanceParams {
  agentId: number;
  name: string;
  instructions: string;
  context: string;
  isOrgVisible?: boolean;
  isReadOnly?: boolean;
  visibleToUsers?: number[];
}

// Create a type for the updateAgentInstance parameters to include visibleToUsers
interface UpdateAgentInstanceParams {
  id: number;
  name?: string;
  instructions?: string;
  context?: string;
  isOrgVisible?: boolean;
  isReadOnly?: boolean;
  visibleToUsers?: number[];
}

// Field permission type for frontend use
export interface FieldPermission {
  id: number;
  instanceId: number;
  fieldName: string;
  isHidden: boolean;
  createdAt: string;
}

// Organization field permission type for frontend use
export interface OrganizationFieldPermission {
  id: number;
  instanceId: number;
  organizationId: number;
  fieldName: string;
  isHidden: boolean;
  createdAt: string;
}

export const useAgentInstances = (agentType?: string) => {
  const queryClient = useQueryClient();
  const { data: agents } = useAgents();
  
  const instances = useQuery<AgentInstance[]>(
    ['agent-instances', agentType],
    async () => {
      const { post } = getAPI();
      const data = await post(getAgentInstances);
      
      // Filter by agent type if needed
      if (agentType && data && agents) {
        // Find the agent ID corresponding to the agent type
        const agent = agents.find(a => a.type === agentType);
        if (agent) {
          return data.filter(instance => instance.agentId === agent.id) || [];
        }
      }
      return data || [];
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!agentType,
    }
  );

  const createInstance = useMutation(
    async ({ 
      name, 
      type, 
      isOrgVisible = false, 
      isReadOnly = false, 
      visibleToUsers = [] 
    }: { 
      name: string; 
      type: string; 
      isOrgVisible?: boolean;
      isReadOnly?: boolean;
      visibleToUsers?: number[];
    }) => {
      const { post } = getAPI();
      // Use type assertion to include visibleToUsers
      return post(createAgentInstanceEndpoint, {
        agentId: parseInt(type),
        name,
        instructions: '',
        context: '',
        isOrgVisible,
        isReadOnly,
        visibleToUsers
      } as any);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['agent-instances', agentType]);
      },
    }
  );

  const updateInstance = useMutation(
    async (params: { 
      id: number; 
      name?: string; 
      instructions?: string; 
      context?: string; 
      isOrgVisible?: boolean;
      isReadOnly?: boolean;
      visibleToUsers?: number[];
    }) => {
      const { post } = getAPI();
      // Use type assertion to include visibleToUsers
      return post(updateAgentInstanceEndpoint, params as any);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['agent-instances', agentType]);
      },
    }
  );

  const deleteInstance = useMutation(
    async (instanceId: string) => {
      const { post } = getAPI();
      await post(deleteAgentInstanceEndpoint, { 
        id: parseInt(instanceId) 
      });
      return instanceId;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['agent-instances', agentType]);
      },
    }
  );

  // Add new utilities for managing team member visibility
  const getInstanceUserVisibility = (instanceId: number) => {
    return useQuery(
      ['agent-instance-user-visibility', instanceId],
      async () => {
        const { post } = getAPI();
        const response = await post(getAgentInstanceUserVisibility, { instanceId });
        return response?.users || [];
      },
      {
        enabled: !!instanceId,
      }
    );
  };

  const getInstanceUserVisibilityWithPermissions = (instanceId: number) => {
    return useQuery(
      ['agent-instance-user-visibility-full', instanceId],
      async () => {
        const { post } = getAPI();
        const response = await post(getAgentInstanceUserVisibility, { instanceId });
        // Use the full visibilities that include isReadOnly information
        return (response?.fullVisibilities || []) as UserVisibility[];
      },
      {
        enabled: !!instanceId,
      }
    );
  };

  const getInstanceOrganizationVisibility = (instanceId: number) => {
    return useQuery(
      ['agent-instance-organization-visibility', instanceId],
      async () => {
        const { post } = getAPI();
        const response = await post(getAgentInstanceOrganizationVisibility, { instanceId });
        // Use the full visibilities that include isReadOnly information
        return (response?.fullVisibilities || []) as OrganizationVisibility[];
      },
      {
        enabled: !!instanceId,
      }
    );
  };

  const updateInstanceUserVisibilities = useMutation(
    async (params: { instanceId: number; userIds: number[] }) => {
      const { post } = getAPI();
      return post(updateAgentInstanceVisibility, {
        id: params.instanceId,
        visibleToUsers: params.userIds,
        isOrgVisible: false // By default, when updating specific users, it's not org-visible
      } as any);
    },
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['agent-instance-user-visibility', variables.instanceId]);
        queryClient.invalidateQueries(['agent-instance-user-visibility-full', variables.instanceId]);
        queryClient.invalidateQueries(['agent-instances', agentType]);
      },
    }
  );

  // New mutation for updating user permissions
  const updateUserPermission = useMutation(
    async (params: { id: number; isHidden: boolean }) => {
      const { post } = getAPI();
      return post(updateAgentInstanceUserFieldPermission, params);
    },
    {
      onSuccess: (data, variables) => {
        if (data) {
          // Invalidate the correct queries using the instance ID returned in the response
          queryClient.invalidateQueries(['agent-instance-user-field-permissions', data.instanceId, data.userId]);
          queryClient.invalidateQueries(['agent-instance-user-visibility', data.instanceId]);
          queryClient.invalidateQueries(['agent-instance-user-visibility-full', data.instanceId]);
          queryClient.invalidateQueries(['agent-instances', agentType]);
        }
      },
    }
  );

  // New mutation for updating base user permissions (read/write access)
  const updateBaseUserPermission = useMutation(
    async (params: { instanceId: number; userId: number; isReadOnly: boolean }) => {
      const { post } = getAPI();
      return post(updateAgentInstanceUserPermission, params);
    },
    {
      onSuccess: (data, variables) => {
        // Invalidate the correct queries
        queryClient.invalidateQueries(['agent-instance-user-visibility', variables.instanceId]);
        queryClient.invalidateQueries(['agent-instance-user-visibility-full', variables.instanceId]);
        queryClient.invalidateQueries(['agent-instances', agentType]);
      },
    }
  );

  // New mutation for updating organization permissions (read/write access)
  const updateBaseOrganizationPermission = useMutation(
    async (params: { instanceId: number; organizationId: number; isReadOnly: boolean }) => {
      const { post } = getAPI();
      return post(updateAgentInstanceOrganizationPermission, params);
    },
    {
      onSuccess: (data, variables) => {
        // Invalidate the correct queries
        queryClient.invalidateQueries(['agent-instance-organization-visibility', variables.instanceId]);
        queryClient.invalidateQueries(['agent-instances', agentType]);
      },
    }
  );

  // New utilities for organization field permissions
  const getInstanceOrganizationFieldPermissions = (instanceId: number, organizationId: number) => {
    return useQuery(
      ['agent-instance-organization-field-permissions', instanceId, organizationId],
      async () => {
        const { post } = getAPI();
        const response = await post(getAgentInstanceOrganizationFieldPermissions, { 
          instanceId, 
          organizationId 
        });
        return response?.permissions || [];
      },
      {
        enabled: !!instanceId && !!organizationId,
        refetchOnWindowFocus: false,
      }
    );
  };

  const createOrganizationFieldPermission = useMutation(
    async (params: { 
      instanceId: number; 
      organizationId: number; 
      fieldName: string; 
      isHidden: boolean 
    }) => {
      const { post } = getAPI();
      return post(createAgentInstanceOrganizationFieldPermission, params);
    },
    {
      onSuccess: (data, variables) => {
        if (data) {
          // Invalidate the specific organization field permissions query
          queryClient.invalidateQueries([
            'agent-instance-organization-field-permissions', 
            variables.instanceId, 
            variables.organizationId
          ]);
          // Also invalidate general field permissions to update combined view
          queryClient.invalidateQueries(['agent-instance-field-permissions', variables.instanceId]);
        }
      },
    }
  );

  const updateOrganizationFieldPermission = useMutation(
    async (params: { 
      id: number; 
      isHidden: boolean; 
      instanceId: number; // Added for cache invalidation
      organizationId: number; // Added for cache invalidation
    }) => {
      const { post } = getAPI();
      // Only send id and isHidden to the API
      return post(updateAgentInstanceOrganizationFieldPermission, {
        id: params.id,
        isHidden: params.isHidden
      });
    },
    {
      onSuccess: (data, variables) => {
        if (data) {
          // Invalidate both specific and general permission queries
          queryClient.invalidateQueries([
            'agent-instance-organization-field-permissions', 
            variables.instanceId, 
            variables.organizationId
          ]);
          queryClient.invalidateQueries(['agent-instance-field-permissions', variables.instanceId]);
        }
      },
    }
  );

  const deleteOrganizationFieldPermission = useMutation(
    async (params: { 
      id: number; 
      instanceId: number; // Added for cache invalidation
      organizationId: number; // Added for cache invalidation
    }) => {
      const { post } = getAPI();
      return post(deleteAgentInstanceOrganizationFieldPermission, { id: params.id });
    },
    {
      onSuccess: (data, variables) => {
        if (data?.success) {
          // Invalidate both specific and general permission queries
          queryClient.invalidateQueries([
            'agent-instance-organization-field-permissions', 
            variables.instanceId, 
            variables.organizationId
          ]);
          queryClient.invalidateQueries(['agent-instance-field-permissions', variables.instanceId]);
        }
      },
    }
  );

  // Function to check if a field is hidden by taking into account both
  // global and organization-specific permissions
  const isFieldHidden = (
    instanceId: number, 
    fieldName: string, 
    globalPermissions: FieldPermission[] = [],
    orgPermissions: OrganizationFieldPermission[] = []
  ) => {
    // Organization-specific permissions take precedence
    const orgPermission = orgPermissions.find(
      p => p.instanceId === instanceId && p.fieldName === fieldName
    );
    
    if (orgPermission !== undefined) {
      return orgPermission.isHidden;
    }
    
    // Fall back to global permission
    const globalPermission = globalPermissions.find(
      p => p.instanceId === instanceId && p.fieldName === fieldName
    );
    
    // If permission exists, return isHidden value, otherwise field is editable (not hidden)
    return globalPermission ? globalPermission.isHidden : false;
  };

  return {
    instances,
    createInstance,
    updateInstance,
    deleteInstance,
    getInstanceUserVisibility,
    getInstanceUserVisibilityWithPermissions,
    getInstanceOrganizationVisibility,
    getInstanceOrganizationFieldPermissions,
    updateInstanceUserVisibilities,
    updateUserPermission,
    updateBaseUserPermission,
    updateBaseOrganizationPermission,
    createOrganizationFieldPermission,
    updateOrganizationFieldPermission,
    deleteOrganizationFieldPermission,
    isFieldHidden
  };
}; 