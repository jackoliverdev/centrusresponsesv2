import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getAgentInstanceOrganizationFieldPermissions,
  createAgentInstanceOrganizationFieldPermission,
  updateAgentInstanceOrganizationFieldPermission,
  deleteAgentInstanceOrganizationFieldPermission
} from 'common';
import { getAPI } from '@/utils/api';

// Organization field permission type for frontend use
export interface OrganizationFieldPermission {
  id: number;
  instanceId: number;
  organizationId: number;
  fieldName: string;
  isHidden: boolean;
  createdAt: string;
}

export const useAgentInstanceOrganizationFieldPermissions = (
  instanceId: number, 
  organizationId: number
) => {
  const queryClient = useQueryClient();
  const queryKey = ['agent-instance-organization-field-permissions', instanceId, organizationId];
  
  // Get organization-specific field permissions
  const permissions = useQuery(
    queryKey,
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
      retry: 2,
      staleTime: 10000, // 10 seconds
    }
  );
  
  // Create organization field permission
  const createPermission = useMutation(
    async (params: { fieldName: string; isHidden: boolean }) => {
      const { post } = getAPI();
      return post(createAgentInstanceOrganizationFieldPermission, {
        instanceId,
        organizationId,
        fieldName: params.fieldName,
        isHidden: params.isHidden
      });
    },
    {
      onSuccess: (data) => {
        if (!data) return;
        
        // Update cache with the new permission
        queryClient.setQueryData<OrganizationFieldPermission[]>(queryKey, (oldData = []) => {
          const newPermission: OrganizationFieldPermission = {
            id: data.id,
            instanceId: data.instanceId,
            organizationId: data.organizationId,
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
        
        // Invalidate related queries to ensure UI consistency
        queryClient.invalidateQueries(['agent-instance-field-permissions', instanceId]);
        queryClient.invalidateQueries(['agent-instance-organization-field-permissions', instanceId, organizationId]);
        
        // Also invalidate any other queries that might depend on field permissions
        queryClient.invalidateQueries(['agent-instance', instanceId]);
      },
      onError: (error) => {
        console.error('Failed to create organization field permission:', error);
      }
    }
  );
  
  // Update organization field permission
  const updatePermission = useMutation(
    async (params: { id: number; isHidden: boolean }) => {
      const { post } = getAPI();
      return post(updateAgentInstanceOrganizationFieldPermission, {
        id: params.id,
        isHidden: params.isHidden
      });
    },
    {
      onSuccess: (data) => {
        if (!data) return;
        
        // Update cache directly with the updated permission
        queryClient.setQueryData<OrganizationFieldPermission[]>(queryKey, (oldData = []) => {
          const updatedPermission: OrganizationFieldPermission = {
            id: data.id,
            instanceId: data.instanceId,
            organizationId: data.organizationId,
            fieldName: data.fieldName,
            isHidden: data.isHidden,
            createdAt: data.createdAt
          };
          
          return oldData.map(p => p.id === data.id ? updatedPermission : p);
        });
        
        // Also invalidate the general field permissions query
        queryClient.invalidateQueries(['agent-instance-field-permissions', instanceId]);
      },
      onError: (error) => {
        console.error('Failed to update organization field permission:', error);
      }
    }
  );
  
  // Delete organization field permission
  const deletePermission = useMutation(
    async (id: number) => {
      const { post } = getAPI();
      return post(deleteAgentInstanceOrganizationFieldPermission, { id });
    },
    {
      onSuccess: (data, variables) => {
        if (!data) return;
        
        // Remove the deleted permission from cache
        queryClient.setQueryData<OrganizationFieldPermission[]>(queryKey, (oldData = []) => {
          return oldData.filter(p => p.id !== variables);
        });
        
        // Also invalidate the general field permissions query
        queryClient.invalidateQueries(['agent-instance-field-permissions', instanceId]);
        
        // Invalidate specific organization permissions query
        queryClient.invalidateQueries([
          'agent-instance-organization-field-permissions', 
          instanceId, 
          organizationId
        ]);
      },
      onError: (error) => {
        console.error('Failed to delete organization field permission:', error);
      }
    }
  );
  
  // Check if a specific field has an organization-level permission
  const getFieldPermission = (fieldName: string): OrganizationFieldPermission | undefined => {
    const data = permissions.data || [];
    return data.find(p => p.fieldName === fieldName);
  };
  
  // Check if a field is hidden based on organization permissions
  const isFieldHidden = (fieldName: string): boolean => {
    const permission = getFieldPermission(fieldName);
    return permission ? permission.isHidden : false;
  };
  
  // Check if a field is editable (not hidden) based on organization permissions
  const isFieldEditable = (fieldName: string): boolean => {
    return !isFieldHidden(fieldName);
  };
  
  return {
    permissions,
    createPermission,
    updatePermission,
    deletePermission,
    getFieldPermission,
    isFieldHidden,
    isFieldEditable,
    isLoading: permissions.isLoading,
    isError: permissions.isError,
    error: permissions.error
  };
}; 