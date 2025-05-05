import { FunctionComponent, useEffect, useState } from 'react';
import { Modal, Button, Table, Switch, Spin, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useAgentInstanceUserFieldPermissions } from '@/hooks/useAgentInstanceUserFieldPermissions';

interface UserFieldPermissionsModalProps {
  instanceId: number;
  userId: number;
  userName: string;
  visible: boolean;
  onClose: () => void;
  fieldDefinitions: Array<{
    name: string;
    label: string;
    description: string;
    step: number;
  }>;
}

export const UserFieldPermissionsModal: FunctionComponent<UserFieldPermissionsModalProps> = ({
  instanceId,
  userId,
  userName,
  visible,
  onClose,
  fieldDefinitions,
}) => {
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Get user field permissions
  const { 
    userFieldPermissions, 
    createUserFieldPermission, 
    updateUserFieldPermission 
  } = useAgentInstanceUserFieldPermissions(instanceId, userId);
  
  const { data, isLoading, refetch } = userFieldPermissions;
  
  // Initialize user field permissions if needed
  useEffect(() => {
    if (!isLoading && data && visible && isInitializing) {
      const initializePermissions = async () => {
        try {
          // For fields that don't have permissions set yet, create default permissions
          let hasError = false;
          
          // Process sequentially with small delay to prevent race conditions
          for (const field of fieldDefinitions) {
            if (hasError) break;
            
            try {
              const existingPermission = data.find(p => p.fieldName === field.name);
              
              if (!existingPermission) {
                // Default to making all fields editable for this user
                const isHidden = false;
                
                // Add small delay to prevent race conditions
                await new Promise(resolve => setTimeout(resolve, 100));
                
                await createUserFieldPermission.mutateAsync({
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
          await refetch();
          setIsInitializing(false);
        } catch (error) {
          console.error('Failed to initialize user field permissions:', error);
          message.error('Failed to initialize user field permissions');
          setIsInitializing(false);
        }
      };
      
      initializePermissions();
    }
  }, [isLoading, data, visible, fieldDefinitions, isInitializing]);
  
  // Handle permission toggle
  const handlePermissionChange = async (fieldName: string, enabled: boolean) => {
    try {
      const existingPermission = data?.find(p => p.fieldName === fieldName);
      
      if (existingPermission) {
        await updateUserFieldPermission.mutateAsync({
          id: existingPermission.id,
          isHidden: !enabled
        });
      } else {
        await createUserFieldPermission.mutateAsync({
          fieldName,
          isHidden: !enabled
        });
      }
      
      message.success(`Permission updated for field: ${fieldName}`);
    } catch (error) {
      console.error('Failed to update permission:', error);
      message.error('Failed to update permission. Please try again.');
    }
  };
  
  // Get permission value for a field
  const getPermissionValue = (fieldName: string) => {
    if (!data) return true; // Default to enabled
    
    const permission = data.find(p => p.fieldName === fieldName);
    return permission ? !permission.isHidden : true; // If not hidden, it's editable
  };
  
  // Columns for the permissions table
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
      title={<h2 className="text-xl font-bold">Field Permissions for {userName}</h2>}
      closeIcon={<CloseOutlined className="text-grey-dark" />}
      className="rounded-xl shadow-card-shadow"
      onCancel={onClose}
    >
      {isLoading || isInitializing ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <p className="mb-4 text-gray-600">
            Set which fields are editable for this specific user. Fields that are not editable will be locked for this user.
          </p>
          
          {Object.entries(groupedFields).map(([stepName, fields]) => (
            <div key={stepName} className="mb-6">
              <h3 className="font-semibold text-lg mb-2">{stepName}</h3>
              <Table
                dataSource={fields}
                columns={columns}
                rowKey="name"
                pagination={false}
                size="small"
              />
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}; 