import { FunctionComponent, useEffect, useState } from 'react';
import { Modal, Button, Table, Switch, Spin, message, Alert } from 'antd';
import { CloseOutlined, LockOutlined, SettingOutlined } from '@ant-design/icons';
import { useAgentInstanceFieldPermissions } from '@/hooks/useAgentInstanceFieldPermissions';
import { useAgentInstanceOrganizationFieldPermissions } from '@/hooks/useAgentInstanceOrganizationFieldPermissions';
import { useQuery, useQueryClient } from 'react-query';
import { getAPI } from '@/utils/api';
import { API } from 'common';

interface FieldPermissionsModalProps {
  instanceId: number;
  visible: boolean;
  onClose: () => void;
  fieldDefinitions: Array<{
    name: string;
    label: string;
    description: string;
    step: number;
  }>;
  isOrgVisible?: boolean;
  isReadOnly?: boolean;
  organizationId?: number;
}

export const FieldPermissionsModal: FunctionComponent<FieldPermissionsModalProps> = ({
  instanceId,
  visible,
  onClose,
  fieldDefinitions,
  isOrgVisible = false,
  isReadOnly = false,
  organizationId
}) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();
  
  // Get global field permissions
  const { fieldPermissions, createFieldPermission, updateFieldPermission, isOrgReadOnly } = useAgentInstanceFieldPermissions(instanceId);
  const { data: instanceFieldPermissions, isLoading: isLoadingInstancePermissions, refetch: refetchInstancePermissions } = fieldPermissions;
  
  // Get organization-specific field permissions if organizationId is provided and isOrgVisible is true
  const orgFieldPermissionsHook = organizationId && isOrgVisible
    ? useAgentInstanceOrganizationFieldPermissions(instanceId, organizationId)
    : null;
  
  // Get current user for checking if they are the creator
  const { data: currentUser } = useQuery('currentUser', async () => {
    const { post } = getAPI();
    return await post(API.getOrCreateUser);
  });
  
  // Initialize field permissions based on visibility settings
  useEffect(() => {
    if (!isLoadingInstancePermissions && instanceFieldPermissions && visible && isInitializing) {
      const initializePermissions = async () => {
        try {
          // For fields that don't have permissions set yet, create default permissions
          let hasError = false;
          
          // Process sequentially with small delay to prevent race conditions
          for (const field of fieldDefinitions) {
            if (hasError) break;
            
            try {
              const existingPermission = instanceFieldPermissions.find(p => p.fieldName === field.name);
              
              if (!existingPermission) {
                // Default logic:
                // 1. For personal instances (not org-visible): all fields are editable
                // 2. For org-visible instances: respect the isReadOnly setting except for core fields
                let isHidden = false;
                
                if (isOrgVisible) {
                  // For org-visible instances, determine field editability
                  const isCoreField = field.name === 'name' || 
                                   field.name === 'instructions' || 
                                   field.name === 'context';
                                   
                  // Core fields always respect org read-only setting
                  // Other fields are editable by default
                  isHidden = isCoreField ? isReadOnly : false;
                }
                
                // Add small delay to prevent race conditions
                await new Promise(resolve => setTimeout(resolve, 100));
                
                await createFieldPermission.mutateAsync({
                  fieldName: field.name,
                  isHidden
                });
              }
            } catch (err) {
              console.warn(`Error initializing field ${field.name}:`, err);
              // Continue with next field rather than aborting everything
            }
          }
          
          // Refresh permissions after initialization
          await refetchInstancePermissions();
          setIsInitializing(false);
        } catch (error) {
          console.error('Failed to initialize field permissions:', error);
          message.error('Failed to initialize field permissions');
          setIsInitializing(false);
        }
      };
      
      initializePermissions();
    }
  }, [isLoadingInstancePermissions, instanceFieldPermissions, visible, fieldDefinitions, isOrgVisible, isReadOnly, isInitializing]);
  
  // Unified permission toggle handler that determines whether to update instance or organization permissions
  const handlePermissionChange = async (fieldName: string, enabled: boolean) => {
    try {
      // Check if organization-level read-only is enabled
      if (isOrgVisible && isOrgReadOnly()) {
        message.error('Cannot update permissions when organisation-level read-only is enabled');
        return;
      }
      
      // If the instance is organisation-visible and we have a valid organisationId,
      // update organisation permissions
      if (isOrgVisible && organizationId && orgFieldPermissionsHook) {
        const existingPermission = orgFieldPermissionsHook.permissions.data?.find(p => p.fieldName === fieldName);
        
        if (existingPermission) {
          // Update existing organisation permission
          await orgFieldPermissionsHook.updatePermission.mutateAsync({
            id: existingPermission.id,
            isHidden: !enabled
          });
        } else {
          // Create new organisation permission
          await orgFieldPermissionsHook.createPermission.mutateAsync({
            fieldName,
            isHidden: !enabled
          });
        }
        
        // Invalidate queries to ensure the UI is updated
        queryClient.invalidateQueries(['agent-instance-organization-field-permissions', instanceId, organizationId]);
        queryClient.invalidateQueries(['agent-instance-field-permissions', instanceId]);
        
        message.success(`Organisation permission updated for field: ${fieldName}`);
      } else {
        // Otherwise, update instance-level permissions
        const existingPermission = instanceFieldPermissions?.find(p => p.fieldName === fieldName);
        
        if (existingPermission) {
          await updateFieldPermission.mutateAsync({
            id: existingPermission.id,
            isHidden: !enabled
          });
        } else {
          await createFieldPermission.mutateAsync({
            fieldName,
            isHidden: !enabled
          });
        }
        
        message.success(`Permission updated for field: ${fieldName}`);
      }
    } catch (error) {
      console.error('Failed to update permission:', error);
      message.error('Failed to update permission. Please try again.');
    }
  };
  
  // Get permission value for a field - either from organisation or instance permissions
  const getPermissionValue = (fieldName: string) => {
    // If the instance is organisation-visible and we have org permissions,
    // use those first
    if (isOrgVisible && orgFieldPermissionsHook && orgFieldPermissionsHook.permissions.data) {
      const orgPermission = orgFieldPermissionsHook.permissions.data.find(p => p.fieldName === fieldName);
      if (orgPermission !== undefined) {
        return !orgPermission.isHidden;
      }
    }
    
    // Fall back to instance permissions
    if (!instanceFieldPermissions) return true; // Default to enabled
    
    const permission = instanceFieldPermissions.find(p => p.fieldName === fieldName);
    return permission ? !permission.isHidden : true; // If not hidden, it's editable
  };
  
  // Permission columns
  const columns = [
    {
      title: 'Field',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: 'Step',
      dataIndex: 'step',
      key: 'step',
      render: (step: number) => `Step ${step}`,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Editable',
      dataIndex: 'name',
      key: 'editable',
      render: (name: string) => (
        <Switch
          checked={getPermissionValue(name)}
          onChange={(checked) => handlePermissionChange(name, checked)}
          disabled={isOrgVisible && isOrgReadOnly()}
        />
      ),
    },
  ];
  
  // Group fields by step
  const groupedFields = fieldDefinitions.reduce((acc, field) => {
    const stepKey = `Step ${field.step}`;
    if (!acc[stepKey]) {
      acc[stepKey] = [];
    }
    acc[stepKey].push(field);
    return acc;
  }, {} as Record<string, typeof fieldDefinitions>);

  return (
    <Modal
      open={visible}
      centered
      width={800}
      footer={<Button onClick={onClose}>Close</Button>}
      title={
        <div className="flex items-center">
          <SettingOutlined className="mr-2" />
          <h2 className="text-xl font-bold m-0">Field Permissions</h2>
        </div>
      }
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      onCancel={onClose}
    >
      {isLoadingInstancePermissions || isInitializing ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <p className="mb-4 text-gray-600">
            Set which fields are editable for this instance. Fields that are not editable will be locked for all users except the instance creator.
          </p>
          
          {isOrgVisible && isOrgReadOnly() && (
            <Alert
              message="Organisation-level Read-only"
              description="This instance has organisation-level read-only permissions enabled. Field permissions cannot be modified."
              type="info"
              showIcon
              icon={<LockOutlined />}
              className="mb-4"
            />
          )}
          
          {isOrgVisible && (
            <Alert
              message={organizationId ? "Organisation Permissions" : "Organisation Settings"}
              description={
                organizationId 
                  ? "You are currently editing organisation-level field permissions. These permissions apply to all organisation members."
                  : "This instance has organisation visibility enabled, but no organisation ID was provided."
              }
              type="info"
              showIcon
              className="mb-4"
            />
          )}
          
          {Object.entries(groupedFields).map(([stepName, fields]) => (
            <div key={stepName} className="mb-6">
              <h3 className="font-semibold text-lg mb-2">{stepName}</h3>
              <Table
                dataSource={fields}
                columns={columns}
                rowKey="name"
                pagination={false}
                size="small"
                loading={(isOrgVisible && orgFieldPermissionsHook?.isLoading) || false}
              />
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}; 