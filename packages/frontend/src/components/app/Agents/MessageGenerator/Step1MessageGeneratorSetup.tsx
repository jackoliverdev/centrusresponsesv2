import { FC, useState, useEffect, useMemo, useRef } from 'react';
import { AgentInstance, useAgentInstances, UserVisibility, OrganizationVisibility } from '@/hooks/useAgentInstances';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, Globe, User, Save, Lock, Edit, AlertTriangle } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { Switch } from '@/components/ui/switch';
import { message, Tooltip } from 'antd';
import { useQuery } from 'react-query';
import { getAPI } from '@/utils/api';
import { API, getAgentInstanceUserFieldPermissions, createAgentInstanceUserFieldPermission, createAgentInstanceOrganizationFieldPermission } from 'common';
import TeamMemberSelector from '@/components/app/TeamMemberSelector';
import { useOrganizationUsers } from '@/hooks/admin/useOrganizationUsers';
import { FieldPermissionsButton } from '../FieldPermissionsButton';
import { useAgentInstanceFieldPermissions } from '@/hooks/useAgentInstanceFieldPermissions';
import { useAgentInstanceUserFieldPermissions } from '@/hooks/useAgentInstanceUserFieldPermissions';
import { useAgentInstanceOrganizationFieldPermissions } from '@/hooks/useAgentInstanceOrganizationFieldPermissions';
import Step2MessageInput from './Step2MessageInput';

interface Step1MessageGeneratorSetupProps {
  instance: AgentInstance;
  onInstanceUpdate?: (updatedInstance: AgentInstance) => void;
}

const Step1MessageGeneratorSetup: FC<Step1MessageGeneratorSetupProps> = ({ instance, onInstanceUpdate }) => {
  const [name, setName] = useState(instance.name || '');
  const [instructions, setInstructions] = useState(instance.instructions || '');
  const [context, setContext] = useState(instance.context || '');
  const [isOrgVisible, setIsOrgVisible] = useState(!!instance.isOrgVisible);
  const [isReadOnly, setIsReadOnly] = useState(!!instance.isReadOnly);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessName, setSaveSuccessName] = useState(false);
  const [saveSuccessInstructions, setSaveSuccessInstructions] = useState(false);
  const [saveSuccessContext, setSaveSuccessContext] = useState(false);
  const [showTeamMemberSelector, setShowTeamMemberSelector] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserVisibility[]>([]);
  const [orgPermissions, setOrgPermissions] = useState<OrganizationVisibility[]>([]);
  const [isSavingTeamMembers, setIsSavingTeamMembers] = useState(false);
  const { data: agents } = useAgents();
  const { 
    updateInstance, 
    getInstanceUserVisibility, 
    getInstanceUserVisibilityWithPermissions, 
    getInstanceOrganizationVisibility, 
    updateUserPermission, 
    updateBaseUserPermission,
    updateBaseOrganizationPermission
  } = useAgentInstances();
  const [isCreator, setIsCreator] = useState(false);
  const [inputName, setInputName] = useState(instance.name || '');

  // Get current user
  const { data: currentUser } = useQuery('currentUser', async () => {
    const { post } = getAPI();
    return await post(API.getOrCreateUser);
  });

  // Get visible users
  const { data: userVisibility, isLoading: isLoadingVisibility } = getInstanceUserVisibility(instance.id);
  
  // Get user permissions
  const { data: userVisibilityWithPermissions, isLoading: isLoadingPermissions } = getInstanceUserVisibilityWithPermissions(instance.id);

  // Get organization permissions
  const { data: orgVisibilityWithPermissions, isLoading: isLoadingOrgPermissions } = getInstanceOrganizationVisibility(instance.id);

  // Get field permissions
  const { fieldPermissions, isOrgReadOnly } = useAgentInstanceFieldPermissions(instance.id);
  const { data: fieldPermissionsData } = fieldPermissions;

  // Get user-specific field permissions
  const userFieldPermissionsHook = currentUser ? useAgentInstanceUserFieldPermissions(instance.id, currentUser.id) : null;
  
  // Get organization-specific field permissions if applicable
  const orgFieldPermissionsHook = useAgentInstanceOrganizationFieldPermissions(
    instance.id,
    currentUser?.organizationId ?? 0
  );

  // Determine if current user is the creator of this instance
  useEffect(() => {
    if (currentUser && instance) {
      setIsCreator(currentUser.id === instance.createdBy);
    }
  }, [currentUser, instance]);

  // Update state whenever instance changes to ensure we have the latest data
  useEffect(() => {
    if (instance) {
      setName(instance.name || '');
      setInputName(instance.name || '');
      setInstructions(instance.instructions || '');
      setContext(instance.context || '');
      setIsOrgVisible(!!instance.isOrgVisible);
      setIsReadOnly(!!instance.isReadOnly);
    }
  }, [instance]);

  // Update selected team members when visibility data is loaded
  useEffect(() => {
    if (userVisibility) {
      setSelectedTeamMembers(userVisibility);
      // If we have team members and visibility is not organization-wide, show the selector
      if (userVisibility.length > 0 && !isOrgVisible) {
        setShowTeamMemberSelector(true);
      }
    }
  }, [userVisibility, isOrgVisible]);
  
  // Update user permissions when data is loaded
  useEffect(() => {
    if (userVisibilityWithPermissions) {
      setUserPermissions(userVisibilityWithPermissions);
    }
  }, [userVisibilityWithPermissions]);
  
  // Update organization permissions when data is loaded
  useEffect(() => {
    if (orgVisibilityWithPermissions) {
      setOrgPermissions(orgVisibilityWithPermissions);
    }
  }, [orgVisibilityWithPermissions]);
  
  const handleResetDefaults = () => {
    if (!canEdit) return;
    
    const agent = agents?.find(a => a.id === instance.agentId);
    if (agent) {
      setInstructions(agent.defaultInstructions);
      setContext(agent.defaultContext);
    }
  };

  // Check if user has edit permission
  const canEdit = useMemo(() => {
    // Creator always has edit permissions
    if (isCreator) return true;
    
    // Check for organization-level read-only
    if (isOrgVisible && isOrgReadOnly()) return false;
    
    // For org-visible instances, check if org members can edit
    if (isOrgVisible) return !isReadOnly;
    
    // For shared instances, check if this user has been given edit permissions
    if (!isOrgVisible && userVisibilityWithPermissions) {
      const userPermission = userVisibilityWithPermissions.find(v => v.userId === currentUser?.id);
      return userPermission ? !userPermission.isReadOnly : false;
    }
    
    return false;
  }, [isCreator, isOrgVisible, isReadOnly, userVisibilityWithPermissions, currentUser?.id, isOrgReadOnly]);

  // Handle visibility toggle
  const handleVisibilityChange = async (checked: boolean) => {
    if (!isCreator) return;
    
    setIsOrgVisible(checked);
    
    // If switching from personal to org, default to read-only
    if (checked && !isOrgVisible) {
      setIsReadOnly(true);
    } else if (!checked) {
      // When switching to Personal, always make it editable
      setIsReadOnly(false);
    }
    
    try {
      const updatedInstance = await updateInstance.mutateAsync({
        id: instance.id,
        isOrgVisible: checked,
        // If switching to org visibility, update team members as well
        visibleToUsers: checked ? [] : selectedTeamMembers,
        // Include the read-only status in the update
        isReadOnly: checked && !isOrgVisible ? true : !checked ? false : isReadOnly
      });
      
      // If turning off org visibility, show team member selector
      if (!checked) {
        setShowTeamMemberSelector(true);
      } else {
        setShowTeamMemberSelector(false);
      }
      
      if (onInstanceUpdate && updatedInstance) {
        onInstanceUpdate({
          ...instance,
          ...updatedInstance,
          isOrgVisible: checked,
          visibleToUsers: checked ? [] : selectedTeamMembers
        });
      }
      
      if (checked) {
        message.success({
          content: (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              <span>Agent is now visible to your entire organisation</span>
            </div>
          ),
          duration: 3
        });
      } else {
        message.success({
          content: (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>Agent is now only visible to you and selected team members</span>
            </div>
          ),
          duration: 3
        });
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      setIsOrgVisible(!checked); // Revert if there's an error
      
      // Also revert read-only state if there's an error
      if (checked && !isOrgVisible) {
        setIsReadOnly(false);
      } else if (!checked) {
        setIsReadOnly(true);
      }
    }
  };

  // Handle read/write toggle
  const handleReadOnlyChange = async (checked: boolean) => {
    if (!isCreator) return;
    
    setIsReadOnly(!checked);
    
    try {
      // Update the instance
      await updateInstance.mutateAsync({
        id: instance.id,
        isReadOnly: !checked
      });
      
      // Also update organization permission if org-visible
      if (isOrgVisible && currentUser) {
        await updateBaseOrganizationPermission.mutateAsync({
          instanceId: instance.id,
          organizationId: currentUser.organizationId,
          isReadOnly: !checked
        });
        
        // When enabling editing (checked=true), initialize default organization field permissions
        // for the core fields (name, instructions, context) if they don't exist yet
        if (checked && orgFieldPermissionsHook) {
          const { post } = getAPI();
          const coreFields = ['name', 'instructions', 'context'];
          
          for (const fieldName of coreFields) {
            const existingPermission = orgFieldPermissionsHook.permissions.data?.find(
              p => p.fieldName === fieldName
            );
            
            if (!existingPermission) {
              try {
                await post(createAgentInstanceOrganizationFieldPermission, {
                  instanceId: instance.id,
                  organizationId: currentUser.organizationId,
                  fieldName: fieldName,
                  isHidden: false // Allow editing by default
                });
              } catch (err) {
                console.error(`Failed to create org permission for field ${fieldName}:`, err);
              }
            }
          }
        }
      }
      
      if (checked) {
        message.success({
          content: (
            <div className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              <span>Organisation members can now edit this agent</span>
            </div>
          ),
          duration: 3
        });
      } else {
        message.success({
          content: (
            <div className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              <span>Organisation members can now only use this agent (read-only)</span>
            </div>
          ),
          duration: 3
        });
      }
    } catch (error) {
      console.error('Error updating read-only status:', error);
      setIsReadOnly(checked); // Revert if there's an error
    }
  };

  // Handle team member selection
  const handleTeamMemberChange = async (userIds: number[]) => {
    setSelectedTeamMembers(userIds);
    
    try {
      setIsSavingTeamMembers(true);
      const updatedInstance = await updateInstance.mutateAsync({
        id: instance.id,
        visibleToUsers: userIds
      });
      if (onInstanceUpdate && updatedInstance) {
        onInstanceUpdate({
          ...instance,
          ...updatedInstance,
          visibleToUsers: userIds
        });
      }
    } catch (error) {
      console.error('Error updating team members:', error);
    } finally {
      setIsSavingTeamMembers(false);
    }
  };

  // Handle user permission change
  const handleUserPermissionChange = async (userId: number, isReadOnly: boolean) => {
    try {
      // Find the visibility record for this user
      const userVisibility = userPermissions.find(p => p.userId === userId);
      if (!userVisibility) {
        console.error('User visibility record not found');
        return;
      }

      const { post } = getAPI();
      
      // 1. First update the main permission level in agent_instance_user_visibility table
      await updateBaseUserPermission.mutateAsync({
        instanceId: instance.id,
        userId: userId,
        isReadOnly: isReadOnly
      });

      // 2. Then handle field permissions to maintain consistency
      // Get existing field permissions
      const fieldResult = await post(getAgentInstanceUserFieldPermissions, { 
        instanceId: instance.id, 
        userId: userId 
      });
      
      // Get existing permissions
      const permissions = fieldResult?.permissions || [];
      
      // For each field that should be managed, ensure correct permissions
      for (const field of messageGeneratorFieldDefinitions) {
        // Find if permission record already exists
        const existingPermission = permissions.find(p => p.fieldName === field.name);
        
        if (existingPermission) {
          // Update existing permission
          await updateUserPermission.mutateAsync({
            id: existingPermission.id,
            isHidden: isReadOnly // Set to hidden if read-only
          });
        } else if (isReadOnly) {
          // Only create new permission records if they should be hidden
          // (By default fields are visible/editable if no record exists)
          await post(createAgentInstanceUserFieldPermission, {
            instanceId: instance.id,
            userId: userId,
            fieldName: field.name,
            isHidden: true
          });
        }
      }
      
      // Update local state
      setUserPermissions(prev => 
        prev.map(p => p.userId === userId ? { ...p, isReadOnly } : p)
      );
      
      message.success({
        content: (
          <div className="flex items-center">
            {isReadOnly ? 
              <Lock className="h-4 w-4 mr-2" /> : 
              <Edit className="h-4 w-4 mr-2" />
            }
            <span>
              Permission updated for user
            </span>
          </div>
        ),
        duration: 2
      });
    } catch (error) {
      console.error('Error updating user permission:', error);
      message.error('Failed to update user permission');
    }
  };

  // Add blur handler for the name field
  const handleNameBlur = () => {
    // Only update if the value changed and user has permission
    if (inputName !== name && isFieldEditable('name')) {
      setName(inputName);
    }
  };

  // Add blur handler for instructions field
  const handleInstructionsBlur = () => {
    // Only save if changed and user has permission
    if (instructions !== instance.instructions && isFieldEditable('instructions')) {
      // Handled by the auto-save effect
    }
  };

  // Add blur handler for context field
  const handleContextBlur = () => {
    // Only save if changed and user has permission
    if (context !== instance.context && isFieldEditable('context')) {
      // Handled by the auto-save effect
    }
  };

  // Modify the handleSave function to exclude name changes from auto-save
  const handleSave = async () => {
    const nameChanged = name !== instance.name;
    const instructionsChanged = instructions !== instance.instructions;
    const contextChanged = context !== instance.context;
    const visibilityChanged = isOrgVisible !== instance.isOrgVisible;
    const readOnlyChanged = isReadOnly !== instance.isReadOnly;
    
    // Only save fields that user has permission to edit
    if (nameChanged && !isFieldEditable('name')) return;
    if (instructionsChanged && !isFieldEditable('instructions')) return;
    if (contextChanged && !isFieldEditable('context')) return;
    
    // Only allow creator to change visibility/permissions
    if ((visibilityChanged || readOnlyChanged) && !isCreator) return;
    
    if (nameChanged || instructionsChanged || contextChanged || visibilityChanged || readOnlyChanged) {
      setIsSaving(true);
      
      // Reset success indicators
      if (nameChanged) setSaveSuccessName(false);
      if (instructionsChanged) setSaveSuccessInstructions(false);
      if (contextChanged) setSaveSuccessContext(false);
      
      try {
        const updatedInstance = await updateInstance.mutateAsync({
          id: instance.id,
          name,
          instructions,
          context,
          isOrgVisible,
          isReadOnly
        });
        
        // Show success indicators for changed fields
        if (nameChanged) {
          setSaveSuccessName(true);
          setTimeout(() => setSaveSuccessName(false), 2000);
          
          // Update the instance in the parent component immediately
          if (onInstanceUpdate && updatedInstance) {
            onInstanceUpdate({
              ...instance,
              ...updatedInstance,
              name,
              instructions,
              context,
              isOrgVisible,
              isReadOnly
            });
          }
          
          // Update document title directly when name changes
          if (document) {
            document.title = `${name} - Message Generator`;
          }
        }
        
        if (instructionsChanged) {
          setSaveSuccessInstructions(true);
          setTimeout(() => setSaveSuccessInstructions(false), 2000);
        }
        
        if (contextChanged) {
          setSaveSuccessContext(true);
          setTimeout(() => setSaveSuccessContext(false), 2000);
        }
      } catch (error) {
        console.error('Failed to save configuration:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  // Add hook to save the form data when it changes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      handleSave();
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [name, instructions, context, isOrgVisible, isReadOnly]);

  // Replace contextObj and additionalContext logic with a flat context object
  const flatContext = useMemo(() => {
    try {
      const parsed = context ? JSON.parse(context) : {};
      // If messageContext is a stringified JSON, merge its fields in
      if (parsed.messageContext && typeof parsed.messageContext === 'string' && parsed.messageContext.trim().startsWith('{')) {
        try {
          const msgCtx = JSON.parse(parsed.messageContext);
          return { ...parsed, ...msgCtx };
        } catch {
          return parsed;
        }
      }
      return parsed;
    } catch {
      return {};
    }
  }, [context]);

  // State for each field, initialised from flatContext
  const [additionalContext, setAdditionalContext] = useState(flatContext.additionalContext || '');
  const [platformType, setPlatformType] = useState(flatContext.platformType || '');
  const [tone, setTone] = useState(flatContext.tone || '');
  const [messageCount, setMessageCount] = useState(flatContext.messageCount || 1);
  const [senderName, setSenderName] = useState(flatContext.senderName || '');
  const [messageContext, setMessageContext] = useState(flatContext.messageContext || '');

  // Keep all fields in sync with context
  useEffect(() => {
    const newContextObj = {
      additionalContext,
      platformType,
      tone,
      messageCount,
      senderName,
      messageContext,
    };
    setContext(JSON.stringify(newContextObj));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalContext, platformType, tone, messageCount, senderName, messageContext]);

  // Define the field definitions for the message generator
  const messageGeneratorFieldDefinitions = [
    // Step 1 fields
    { name: 'name', label: 'Instance Name', description: 'The name of this agent instance', step: 1 },
    { name: 'instructions', label: 'Instructions', description: 'Instructions for generating messages', step: 1 },
    { name: 'context', label: 'Additional Context', description: 'Background information or context for the agent', step: 1 },
    
    // Step 2 fields
    { name: 'platformType', label: 'Message Platform', description: 'Platform for which to generate messages', step: 2 },
    { name: 'customPlatformType', label: 'Custom Platform Type', description: 'Custom platform type (if "Custom" is selected)', step: 2 },
    { name: 'tone', label: 'Message Tone', description: 'Tone for the generated messages', step: 2 },
    { name: 'messageCount', label: 'Number of Message Variants', description: 'Number of message variants to generate', step: 2 },
    { name: 'senderName', label: 'Sender Name', description: 'Name of the sender in the messages', step: 2 },
    { name: 'messageContext', label: 'Message Context', description: 'Context and details for the message generation', step: 2 }
  ];

  // Function to check if a specific field is editable
  const isFieldEditable = (fieldName: string) => {
    // Debug: log the orgFieldPermissionsHook and orgId
    if (process.env.NODE_ENV !== 'production') {
      const orgEditable = orgFieldPermissionsHook?.isFieldEditable(fieldName);
      console.log(`isFieldEditable(${fieldName}): orgEditable=`, orgEditable);
    }
    // 1. Organisation-level read-only (highest priority)
    if (isOrgVisible && isOrgReadOnly()) return isCreator;

    // 2. Organisation-level field permissions (next priority)
    if (orgFieldPermissionsHook && !isCreator && isOrgVisible) {
      if (!orgFieldPermissionsHook.isFieldEditable(fieldName)) {
        return false;
      }
    }

    // 3. User-specific field permissions
    if (currentUser && userFieldPermissionsHook && !isCreator) {
      if (typeof userFieldPermissionsHook.isFieldEditable === 'function') {
        return userFieldPermissionsHook.isFieldEditable(fieldName);
      }
      return true; // Default to editable if method not available
    }

    // 4. Instance-wide permissions
    if (isCreator) return true; // Creator can always edit
    if (!canEdit) return false; // User with no general edit permission can't edit any field

    // 5. Field-specific permissions
    const permission = fieldPermissionsData?.find(p => p.fieldName === fieldName);
    return permission ? !permission.isHidden : true; // If not hidden, it's editable
  };

  // TOP-LEVEL LOGGING FOR DEBUGGING
  console.log('DEBUG: currentUser:', currentUser);
  console.log('DEBUG: instance:', instance);
  console.log('DEBUG: instance.isOrgVisible:', instance?.isOrgVisible);
  console.log('DEBUG: currentUser.organizationId:', currentUser?.organizationId);
  console.log('DEBUG: Instantiating orgFieldPermissionsHook with instanceId:', instance?.id, 'and orgId:', currentUser?.organizationId);
  console.log('DEBUG: orgFieldPermissionsHook:', orgFieldPermissionsHook);
  console.log('DEBUG: orgFieldPermissionsHook?.permissions:', orgFieldPermissionsHook?.permissions);
  console.log('DEBUG: orgFieldPermissionsHook?.permissions.data:', orgFieldPermissionsHook?.permissions?.data);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium mb-1">Configure Message Generator</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Customise how this agent generates messages. You can provide specific instructions or context to improve results.
      </p>

      {!isCreator && !canEdit && !isOrgReadOnly() && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center">
          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
          <p className="text-xs text-amber-700">
            This is a shared agent instance. You have read-only access.
          </p>
        </div>
      )}

      {!isCreator && isOrgVisible && isOrgReadOnly() && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center">
          <Lock className="h-3 w-3 text-amber-500 mr-1" />
          <p className="text-xs text-amber-700">
            This agent has organisation-level read-only permissions enabled.
          </p>
        </div>
      )}

      {!isCreator && canEdit && !isOrgReadOnly() && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md flex items-center">
          <Edit className="h-3 w-3 text-green-500 mr-1" />
          <p className="text-xs text-green-700">
            This is a shared agent instance. You have {
              // Check if any field permissions are hidden, prioritising org-level first
              (orgFieldPermissionsHook && messageGeneratorFieldDefinitions.some(field => !orgFieldPermissionsHook.isFieldEditable(field.name))) ? "limited edit access" :
              (fieldPermissionsData && fieldPermissionsData.some(p => p.isHidden)) ? "limited edit access" :
              (userFieldPermissionsHook && messageGeneratorFieldDefinitions.some(field => !userFieldPermissionsHook.isFieldEditable(field.name))) ? "limited edit access" :
              "full edit access"
            } to this instance.
          </p>
        </div>
      )}

      {isCreator && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center">
          <User className="h-3 w-3 text-blue-500 mr-1" />
          <p className="text-xs text-blue-700">
            You created this agent instance and have full access to all settings.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Instance Name</Label>
          <Input
            id="name"
            value={inputName}
            onChange={(e) => {
              if (!isFieldEditable('name')) return;
              setInputName(e.target.value);
              setSaveSuccessName(false);
            }}
            onBlur={handleNameBlur}
            className={`resize-none ${!isFieldEditable('name') ? "opacity-70 cursor-not-allowed" : ""}`}
            disabled={!isFieldEditable('name')}
          />
          {/* DEBUG: isFieldEditable(name): {isFieldEditable('name').toString()} */}
          {/* DEBUG: Input[name] disabled: {!isFieldEditable('name').toString()} */}
        </div>

        <div className="space-y-2 mt-6">
          <Label htmlFor="instructions" className="text-sm font-medium">Instructions</Label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => {
              if (!isFieldEditable('instructions')) return;
              setInstructions(e.target.value);
              setSaveSuccessInstructions(false);
            }}
            onBlur={handleInstructionsBlur}
            className={`resize-none min-h-[120px] ${!isFieldEditable('instructions') ? "opacity-70 cursor-not-allowed" : ""}`}
            rows={5}
            disabled={!isFieldEditable('instructions')}
          />
          {/* DEBUG: isFieldEditable(instructions): {isFieldEditable('instructions').toString()} */}
          {/* DEBUG: Textarea[instructions] disabled: {!isFieldEditable('instructions').toString()} */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Specific instructions for the AI to follow when creating messages.
            </p>
            {isFieldEditable('instructions') && (
              <div className="flex items-center">
                {saveSuccessInstructions && (
                  <span className="text-xs text-green-600 mr-2 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Saved
                  </span>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetDefaults}
                  className="text-xs h-7"
                >
                  Default
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <Label htmlFor="context" className="text-sm font-medium">Additional Context</Label>
          <Textarea
            id="context"
            value={additionalContext}
            onChange={(e) => {
              if (!isFieldEditable('context')) return;
              setAdditionalContext(e.target.value);
              setSaveSuccessContext(false);
            }}
            onBlur={handleContextBlur}
            className={`resize-none min-h-[150px] ${!isFieldEditable('context') ? "opacity-70 cursor-not-allowed" : ""}`}
            rows={6}
            disabled={!isFieldEditable('context')}
          />
          {/* DEBUG: isFieldEditable(context): {isFieldEditable('context').toString()} */}
          {/* DEBUG: Textarea[context] disabled: {!isFieldEditable('context').toString()} */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Background information or organisational context to help the AI generate better results.
            </p>
            {saveSuccessContext && isFieldEditable('context') && (
              <span className="text-xs text-green-600 flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4 p-2 bg-gray-50 rounded-md">
          <div className="flex-grow">
            <Label htmlFor="visibility" className={`text-sm font-medium ${!isCreator ? "text-muted-foreground" : ""}`}>Visibility</Label>
            <p className="text-xs text-muted-foreground">
              {isOrgVisible ? "Everyone in your organisation can see and use this agent instance" : "Only you can see and use this agent instance"}
            </p>
            {!isCreator && <p className="text-xs text-amber-500 mt-1">Only the creator can change visibility settings</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selectedTeamMembers.length > 0 ? "Shared" : "Private"}</span>
            <Tooltip title={!isCreator ? "Only the creator can change visibility settings" : ""}>
              <Switch 
                id="visibility" 
                checked={isOrgVisible} 
                onCheckedChange={handleVisibilityChange}
                disabled={!isCreator}
                className={!isCreator ? "opacity-60" : ""}
              />
            </Tooltip>
            <span className="text-xs font-medium">Organisation</span>
          </div>
        </div>

        {/* Add team member selection section */}
        {!isOrgVisible && isCreator && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <div>
                <Label className="text-sm font-medium">Team Members</Label>
                <p className="text-xs text-muted-foreground">
                  Select specific team members who can access this agent
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTeamMemberSelector(!showTeamMemberSelector)}
              >
                {showTeamMemberSelector ? 'Hide' : 'Select Members'}
              </Button>
            </div>
            
            {showTeamMemberSelector && (
              <div className="mt-2 border rounded-md p-2">
                {isLoadingVisibility || isLoadingPermissions ? (
                  <div className="py-2 text-center text-sm text-muted-foreground">Loading team member settings...</div>
                ) : (
                  <TeamMemberSelector
                    selectedUserIds={selectedTeamMembers}
                    onChange={handleTeamMemberChange}
                    excludeUserId={currentUser?.id}
                    disabled={isSavingTeamMembers}
                    instanceId={instance.id}
                    userPermissions={userPermissions}
                    onPermissionChange={handleUserPermissionChange}
                    fieldDefinitions={messageGeneratorFieldDefinitions}
                    showFieldPermissions={true}
                  />
                )}
              </div>
            )}
            
            {selectedTeamMembers.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  {selectedTeamMembers.length} team member{selectedTeamMembers.length !== 1 ? 's' : ''} can access this agent
                </p>
              </div>
            )}
          </div>
        )}

        {isOrgVisible && isCreator && (
          <div className="flex items-center space-x-2 mt-2 p-2 bg-gray-50 rounded-md">
            <div className="flex-grow">
              <Label htmlFor="permissions" className="text-sm font-medium">Permissions</Label>
              <p className="text-xs text-muted-foreground">
                {isReadOnly 
                  ? "Organisation members can only use this agent (read-only)" 
                  : "Organisation members can edit this agent's configuration"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Read-only</span>
              <Switch 
                id="permissions" 
                checked={!isReadOnly} 
                onCheckedChange={handleReadOnlyChange}
              />
              <span className="text-xs font-medium">Can edit</span>
              
              {/* Show field permissions button only when edit is toggled */}
              {!isReadOnly && !isOrgReadOnly() && (
                <FieldPermissionsButton 
                  instanceId={instance.id} 
                  fieldDefinitions={messageGeneratorFieldDefinitions}
                  isCreator={isCreator}
                  isOrgVisible={isOrgVisible}
                  isReadOnly={isReadOnly}
                  organizationId={currentUser?.organizationId}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step1MessageGeneratorSetup; 