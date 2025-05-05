import { FunctionComponent, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { FieldPermissionsModal } from './FieldPermissionsModal';
import { useAgentInstanceFieldPermissions } from '@/hooks/useAgentInstanceFieldPermissions';
import { useAgentInstanceOrganizationFieldPermissions } from '@/hooks/useAgentInstanceOrganizationFieldPermissions';

interface FieldPermissionsButtonProps {
  instanceId: number;
  fieldDefinitions: Array<{
    name: string;
    label: string;
    description: string;
    step: number;
  }>;
  isCreator: boolean;
  isOrgVisible?: boolean;
  isReadOnly?: boolean;
  organizationId?: number;
}

export const FieldPermissionsButton: FunctionComponent<FieldPermissionsButtonProps> = ({
  instanceId,
  fieldDefinitions,
  isCreator,
  isOrgVisible = false,
  isReadOnly = false,
  organizationId
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { isOrgReadOnly } = useAgentInstanceFieldPermissions(instanceId);
  
  // Initialize the organization field permissions hook if organizationId is provided
  const orgFieldPermissionsHook = organizationId 
    ? useAgentInstanceOrganizationFieldPermissions(instanceId, organizationId)
    : null;
  
  // Only show for creators
  if (!isCreator) return null;
  
  // If organization-level read-only is enabled, disable the button
  const isDisabled = isOrgVisible && isOrgReadOnly();
  
  // Determine the tooltip based on permissions state
  let tooltipText = "Field Permissions";
  if (isDisabled) {
    tooltipText = "Organisation-level read-only is enabled";
  } else if (organizationId && isOrgVisible) {
    tooltipText = "Manage instance and organisation field permissions";
  }
  
  return (
    <>
      <Tooltip title={tooltipText}>
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => setModalVisible(true)}
          className="ml-2"
          disabled={isDisabled}
        />
      </Tooltip>
      
      <FieldPermissionsModal
        instanceId={instanceId}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        fieldDefinitions={fieldDefinitions}
        isOrgVisible={isOrgVisible}
        isReadOnly={isReadOnly}
        organizationId={organizationId}
      />
    </>
  );
}; 