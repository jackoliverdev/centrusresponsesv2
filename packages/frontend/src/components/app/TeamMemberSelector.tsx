import React, { FC, useState, useEffect } from 'react';
import { Checkbox, Divider, Spin, Empty, Select, Button } from 'antd';
import { useOrganizationUsers } from '@/hooks/admin/useOrganizationUsers';
import { Avatar } from '@/components/ui/avatar';
import { getUserLabel } from '@/utils/user';
import { UserVisibility } from '@/hooks/useAgentInstances';
import { SettingOutlined } from '@ant-design/icons';
import { UserFieldPermissionsModal } from '@/components/app/Agents/UserFieldPermissionsModal';

interface TeamMemberSelectorProps {
  selectedUserIds: number[];
  onChange: (userIds: number[]) => void;
  excludeUserId?: number; // Typically the current user
  disabled?: boolean;
  instanceId?: number; // Added for permission controls
  userPermissions?: UserVisibility[]; // Added for permission controls
  onPermissionChange?: (userId: number, isReadOnly: boolean) => void; // Added for permission controls
  fieldDefinitions?: Array<{
    name: string;
    label: string;
    description: string;
    step: number;
  }>;
  showFieldPermissions?: boolean;
}

const TeamMemberSelector: FC<TeamMemberSelectorProps> = ({ 
  selectedUserIds, 
  onChange, 
  excludeUserId,
  disabled = false,
  instanceId,
  userPermissions = [],
  onPermissionChange,
  fieldDefinitions = [],
  showFieldPermissions = false
}) => {
  const { data: organizationUsers = [], isLoading } = useOrganizationUsers();
  const [selectedUsers, setSelectedUsers] = useState<number[]>(selectedUserIds || []);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<number | null>(null);
  
  // Filter out the excluded user (typically current user)
  const availableUsers = organizationUsers.filter(user => 
    excludeUserId ? user.id !== excludeUserId : true
  );
  
  // Update selected users when selectedUserIds prop changes
  useEffect(() => {
    setSelectedUsers(selectedUserIds || []);
  }, [selectedUserIds]);
  
  const handleSelectAll = () => {
    const allUserIds = availableUsers.map(user => user.id);
    setSelectedUsers(allUserIds);
    onChange(allUserIds);
  };
  
  const handleDeselectAll = () => {
    setSelectedUsers([]);
    onChange([]);
  };
  
  const handleUserChange = (userId: number, checked: boolean) => {
    const newSelectedUsers = checked
      ? [...selectedUsers, userId]
      : selectedUsers.filter(id => id !== userId);
    
    setSelectedUsers(newSelectedUsers);
    onChange(newSelectedUsers);
  };

  // Get permission for user
  const getUserPermission = (userId: number) => {
    const permission = userPermissions.find(p => p.userId === userId);
    return permission?.isReadOnly !== false; // Default to read-only if not found or undefined
  };
  
  // Handle permission change
  const handlePermissionChange = (userId: number, value: string) => {
    if (onPermissionChange) {
      onPermissionChange(userId, value === 'read');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spin size="small" />
      </div>
    );
  }
  
  if (availableUsers.length === 0) {
    return <Empty description="No team members found" />;
  }
  
  return (
    <div className="max-h-48 overflow-y-auto p-1">
      <div className="flex justify-between mb-2">
        <a 
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
          style={{ visibility: disabled ? 'hidden' : 'visible' }}
        >
          Select all
        </a>
        <a 
          onClick={handleDeselectAll}
          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
          style={{ visibility: disabled ? 'hidden' : 'visible' }}
        >
          Deselect all
        </a>
      </div>
      
      <Divider className="my-2" />
      
      <div className="space-y-2">
        {availableUsers.map(user => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox
                checked={selectedUsers.includes(user.id)}
                onChange={(e) => handleUserChange(user.id, e.target.checked)}
                disabled={disabled}
              />
              <div className="ml-2 flex items-center">
                <Avatar size={24} className="mr-2" />
                <span className="text-sm">{getUserLabel(user)}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Field Permissions button (only shown for selected users with edit permissions) */}
              {selectedUsers.includes(user.id) && 
                showFieldPermissions && 
                fieldDefinitions.length > 0 && 
                instanceId && 
                !getUserPermission(user.id) && (
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => setSelectedUserForPermissions(user.id)}
                  size="small"
                  className="mr-2"
                  title="Field Permissions"
                />
              )}
              
              {/* Permission selector (only shown for selected users) */}
              {selectedUsers.includes(user.id) && onPermissionChange && (
                <Select
                  value={getUserPermission(user.id) ? 'read' : 'edit'}
                  onChange={(value) => handlePermissionChange(user.id, value)}
                  options={[
                    { value: 'read', label: 'Read-only' },
                    { value: 'edit', label: 'Can edit' },
                  ]}
                  size="small"
                  style={{ width: 120 }}
                  disabled={disabled}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* User-specific field permissions modal */}
      {selectedUserForPermissions && instanceId && fieldDefinitions.length > 0 && (
        <UserFieldPermissionsModal
          instanceId={instanceId}
          userId={selectedUserForPermissions}
          userName={getUserLabel(organizationUsers.find(u => u.id === selectedUserForPermissions) || { email: '' })}
          visible={!!selectedUserForPermissions}
          onClose={() => setSelectedUserForPermissions(null)}
          fieldDefinitions={fieldDefinitions}
        />
      )}
    </div>
  );
};

export default TeamMemberSelector; 