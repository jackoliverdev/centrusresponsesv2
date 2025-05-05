import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getAgentInstanceFieldPermissions, 
  createAgentInstanceFieldPermission,
  updateAgentInstanceFieldPermission,
  deleteAgentInstanceFieldPermission,
  AgentInstanceFieldPermissionSchema,
  AgentInstanceOrganizationVisibilitySchema,
  getAgentInstanceOrganizationVisibility,
  getAgentInstanceOrganizationFieldPermissions
} from 'common';
import { getAPI } from '@/utils/api';
import { FieldPermission } from './useAgentInstances';

export const useAgentInstanceFieldPermissions = (instanceId: number, organizationId?: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['agent-instance-field-permissions', instanceId];
  
  // Get field permissions
  const fieldPermissions = useQuery(
    queryKey,
    async () => {
      const { post } = getAPI();
      const response = await post(getAgentInstanceFieldPermissions, { instanceId });
      return response?.permissions || [];
    },
    {
      enabled: !!instanceId,
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 10000, // 10 seconds
    }
  );
  
  // Get organization field permissions if organizationId is provided
  const organizationFieldPermissions = useQuery(
    ['agent-instance-organization-field-permissions', instanceId, organizationId],
    async () => {
      if (!organizationId) return [];
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
  
  // Get organization visibilities for this instance
  const orgVisibility = useQuery(
    ['agent-instance-organization-visibility', instanceId],
    async () => {
      const { post } = getAPI();
      const response = await post(getAgentInstanceOrganizationVisibility, { instanceId });
      return response?.fullVisibilities || [];
    },
    {
      enabled: !!instanceId,
      refetchOnWindowFocus: false,
    }
  );
  
  // Check if instance is read-only at organization level
  const isOrgReadOnly = (): boolean => {
    if (!orgVisibility.data || orgVisibility.data.length === 0) return false;
    return orgVisibility.data[0].isReadOnly; 
  };

  // Get combined field permissions (global + organization-specific)
  const getCombinedFieldPermissions = () => {
    const globalPermissions = fieldPermissions.data || [];
    const orgPermissions = organizationFieldPermissions.data || [];
    
    // For fields with both global and org-specific permissions, org permissions take precedence
    const permissionMap = new Map<string, FieldPermission>();
    
    // Add global permissions first
    globalPermissions.forEach(permission => {
      permissionMap.set(permission.fieldName, permission);
    });
    
    // Override with organization-specific permissions if they exist
    orgPermissions.forEach(permission => {
      permissionMap.set(permission.fieldName, permission);
    });
    
    return Array.from(permissionMap.values());
  };
  
  // Check if a field is hidden based on combined permissions
  const isFieldHidden = (fieldName: string): boolean => {
    const combinedPermissions = getCombinedFieldPermissions();
    const permission = combinedPermissions.find(p => p.fieldName === fieldName);
    return permission ? permission.isHidden : false;
  };
  
  // Create field permission
  const createFieldPermission = useMutation(
    async (params: { fieldName: string; isHidden: boolean }) => {
      const { post } = getAPI();
      return post(createAgentInstanceFieldPermission, {
        instanceId,
        fieldName: params.fieldName,
        isHidden: params.isHidden
      });
    },
    {
      onSuccess: (data) => {
        if (!data) return;
        
        // Update cache with the new permission
        queryClient.setQueryData<FieldPermission[]>(queryKey, (oldData = []) => {
          const newPermission: FieldPermission = {
            id: data.id,
            instanceId: data.instanceId,
            fieldName: data.fieldName,
            isHidden: data.isHidden,
            createdAt: data.createdAt
          };
          
          // Add new permission to the list if it doesn't exist already
          const exists = oldData.some(p => p.fieldName === data.fieldName);
          if (!exists) {
            return [...oldData, newPermission];
          }
          // Replace existing permission with updated one
          return oldData.map(p => p.fieldName === data.fieldName ? newPermission : p);
        });
      },
      onError: (error) => {
        console.error('Failed to create field permission:', error);
      }
    }
  );
  
  // Update field permission
  const updateFieldPermission = useMutation(
    async (params: { id: number; isHidden: boolean }) => {
      // Check if organization-level read-only is enabled
      if (isOrgReadOnly()) {
        throw new Error('Cannot update field permissions when organization-level read-only is enabled');
      }
      
      const { post } = getAPI();
      return post(updateAgentInstanceFieldPermission, params);
    },
    {
      onSuccess: (data) => {
        if (!data) return;
        
        // Update cache directly with the updated permission
        queryClient.setQueryData<FieldPermission[]>(queryKey, (oldData = []) => {
          const updatedPermission: FieldPermission = {
            id: data.id,
            instanceId: data.instanceId,
            fieldName: data.fieldName,
            isHidden: data.isHidden,
            createdAt: data.createdAt
          };
          
          return oldData.map(p => p.id === data.id ? updatedPermission : p);
        });
      },
      onError: (error) => {
        console.error('Failed to update field permission:', error);
      }
    }
  );
  
  return { 
    fieldPermissions, 
    organizationFieldPermissions,
    getCombinedFieldPermissions,
    isFieldHidden, 
    createFieldPermission, 
    updateFieldPermission, 
    isOrgReadOnly 
  };
};