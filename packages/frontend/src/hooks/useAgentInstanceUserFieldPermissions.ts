import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getAgentInstanceUserFieldPermissions, 
  createAgentInstanceUserFieldPermission,
  updateAgentInstanceUserFieldPermission,
  deleteAgentInstanceUserFieldPermission,
  AgentInstanceUserFieldPermissionSchema
} from 'common';
import { getAPI } from '@/utils/api';
import { useCallback } from 'react';
import { UseQueryResult } from 'react-query';

// Define a type for user field permissions
export interface UserFieldPermission {
  id: number;
  instanceId: number;
  userId: number;
  fieldName: string;
  isHidden: boolean;
  createdAt: string;
}

export const useAgentInstanceUserFieldPermissions = (instanceId: number, userId: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['agent-instance-user-field-permissions', instanceId, userId];
  
  // Get user field permissions
  let userFieldPermissions = useQuery(
    queryKey,
    async () => {
      const { post } = getAPI();
      const response = await post(getAgentInstanceUserFieldPermissions, { instanceId, userId });
      return response?.permissions || [];
    },
    {
      enabled: !!instanceId && !!userId,
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 10000, // 10 seconds
    }
  );
  
  // If the query is disabled, ensure a default object is returned
  if (!instanceId || !userId) {
    userFieldPermissions = {
      data: [],
      error: null,
      isError: false,
      isIdle: false,
      isLoading: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      refetch: async () => userFieldPermissions,
      remove: () => {},
      status: 'success',
    } as unknown as UseQueryResult<UserFieldPermission[], unknown>;
  }
  
  // Always provide a data property that is an array
  const safeUserFieldPermissions = {
    ...userFieldPermissions,
    data: Array.isArray(userFieldPermissions.data) ? userFieldPermissions.data : [],
  };
  
  // Create user field permission
  const createUserFieldPermission = useMutation(
    async (params: { fieldName: string; isHidden: boolean }) => {
      const { post } = getAPI();
      return post(createAgentInstanceUserFieldPermission, {
        instanceId,
        userId,
        fieldName: params.fieldName,
        isHidden: params.isHidden
      });
    },
    {
      onSuccess: (data) => {
        if (!data) return;
        
        // Update cache with the new permission
        queryClient.setQueryData<UserFieldPermission[]>(queryKey, (oldData = []) => {
          const newPermission: UserFieldPermission = {
            id: data.id,
            instanceId: data.instanceId,
            userId: data.userId,
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
        console.error('Failed to create user field permission:', error);
      }
    }
  );
  
  // Update user field permission
  const updateUserFieldPermission = useMutation(
    async (params: { id: number; isHidden: boolean }) => {
      const { post } = getAPI();
      return post(updateAgentInstanceUserFieldPermission, params);
    },
    {
      onSuccess: (data) => {
        if (!data) return;
        
        // Update cache directly with the updated permission
        queryClient.setQueryData<UserFieldPermission[]>(queryKey, (oldData = []) => {
          const updatedPermission: UserFieldPermission = {
            id: data.id,
            instanceId: data.instanceId,
            userId: data.userId,
            fieldName: data.fieldName,
            isHidden: data.isHidden,
            createdAt: data.createdAt
          };
          
          return oldData.map(p => p.id === data.id ? updatedPermission : p);
        });
      },
      onError: (error) => {
        console.error('Failed to update user field permission:', error);
      }
    }
  );
  
  // Delete user field permission
  const deleteUserFieldPermission = useMutation(
    async (id: number) => {
      const { post } = getAPI();
      return post(deleteAgentInstanceUserFieldPermission, { id });
    },
    {
      onSuccess: (_, id) => {
        // Remove from cache
        queryClient.setQueryData<UserFieldPermission[]>(queryKey, (oldData = []) => {
          return oldData.filter(p => p.id !== id);
        });
      },
      onError: (error) => {
        console.error('Failed to delete user field permission:', error);
      }
    }
  );
  
  // Check if a field is editable by the user
  const isFieldEditable = useCallback(
    (fieldName: string): boolean => {
      const permissions = Array.isArray(safeUserFieldPermissions?.data) ? safeUserFieldPermissions.data : [];
      const permission = permissions.find(p => p.fieldName === fieldName);
      return permission ? !permission.isHidden : true;
    },
    [safeUserFieldPermissions?.data]
  );
  
  return { 
    userFieldPermissions: safeUserFieldPermissions, 
    createUserFieldPermission, 
    updateUserFieldPermission,
    deleteUserFieldPermission,
    isFieldEditable
  };
}; 