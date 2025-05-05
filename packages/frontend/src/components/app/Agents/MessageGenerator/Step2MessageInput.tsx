import { FC } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { Input, Typography, Alert } from 'antd';
import { useAgentInstanceFieldPermissions } from '@/hooks/useAgentInstanceFieldPermissions';
import { useAgentInstanceUserFieldPermissions } from '@/hooks/useAgentInstanceUserFieldPermissions';
import { useAgentInstanceOrganizationFieldPermissions } from '@/hooks/useAgentInstanceOrganizationFieldPermissions';
import { useAuthContext } from '@/context/AuthContext';
import { getAPI } from '@/utils/api';
import { getAgentInstances } from 'common';
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const { Text } = Typography;

interface Step2MessageInputProps {
  messageContext: string;
  setMessageContext: (context: string) => void;
  platformType: string;
  setPlatformType: (type: string) => void;
  customPlatformType?: string;
  setCustomPlatformType?: (type: string) => void;
  messageCount: number;
  setMessageCount: (count: number) => void;
  tone: string;
  setTone: (tone: string) => void;
  senderName: string;
  setSenderName: (name: string) => void;
  showValidation?: boolean;
  instanceId?: number;
  isOrgVisible?: boolean;
  isReadOnly?: boolean;
}

const Step2MessageInput: FC<Step2MessageInputProps> = ({
  messageContext,
  setMessageContext,
  platformType,
  setPlatformType,
  customPlatformType,
  setCustomPlatformType,
  messageCount,
  setMessageCount,
  tone,
  setTone,
  senderName,
  setSenderName,
  showValidation = false,
  instanceId,
  isOrgVisible = false,
  isReadOnly = false
}) => {
  // Get field permissions
  const { fieldPermissions, isOrgReadOnly } = useAgentInstanceFieldPermissions(instanceId || 0);
  const { data: fieldPermissionsData } = fieldPermissions;

  // Get current user
  const { user } = useAuthContext();
  
  // Track if current user is creator
  const [isCreator, setIsCreator] = useState(false);
  
  // Fetch instance data to determine if user is creator
  useEffect(() => {
    if (user && instanceId) {
      const fetchInstanceData = async () => {
        try {
          const { post } = getAPI();
          const instances = await post(getAgentInstances);
          const instance = instances?.find((i: any) => i.id === instanceId);
          if (instance) {
            setIsCreator(user.id === instance.createdBy);
          }
        } catch (error) {
          console.error('Error fetching instance data:', error);
        }
      };
      
      fetchInstanceData();
    }
  }, [user, instanceId]);

  // Get user-specific field permissions with null check for instanceId
  const userFieldPermissionsHook = user && instanceId ? useAgentInstanceUserFieldPermissions(instanceId, user.id) : null;
  
  // Get organisation-specific field permissions if applicable
  const orgFieldPermissionsHook = user && instanceId && isOrgVisible && user.organizationId ? 
    useAgentInstanceOrganizationFieldPermissions(instanceId, user.organizationId) : null;

  // Function to check if a specific field is editable
  const isFieldEditable = (fieldName: string) => {
    // 1. Organisation-level read-only (highest priority)
    if (isOrgVisible && (isOrgReadOnly() || isReadOnly)) {
      return isCreator; // Only creator can edit
    }

    // 2. Organisation-level field permissions (next priority)
    if (orgFieldPermissionsHook && !isCreator && isOrgVisible) {
      if (!orgFieldPermissionsHook.isFieldEditable(fieldName)) {
        return false;
      }
    }

    // 3. User-specific field permissions
    if (user && userFieldPermissionsHook && !isCreator) {
      return userFieldPermissionsHook.isFieldEditable(fieldName);
    }

    // 4. Instance-wide permissions
    if (isCreator) return true; // Creator can always edit

    // 5. Field-specific permissions
    const permission = fieldPermissionsData?.find(p => p.fieldName === fieldName);
    return permission ? !permission.isHidden : true; // If not hidden, it's editable
  };
  
  const platformOptions = [
    { value: 'generic', label: 'Generic' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'whatsapp', label: 'WhatsApp' }
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'persuasive', label: 'Persuasive' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'informative', label: 'Informative' }
  ];

  const messageCountOptions = [
    { value: 1, label: '1 message' },
    { value: 2, label: '2 messages' },
    { value: 3, label: '3 messages' },
    { value: 5, label: '5 messages' }
  ];

  const updateField = (key: string, value: any) => {
    switch (key) {
      case 'platformType':
        setPlatformType(value);
        break;
      case 'tone':
        setTone(value);
        break;
      case 'messageCount':
        setMessageCount(value);
        break;
      case 'senderName':
        setSenderName(value);
        break;
      case 'messageContext':
        setMessageContext(value);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium mb-1">Message Details</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Provide details about the message you want to generate, including the platform, tone, and context.
      </p>

      {showValidation && !messageContext.trim() && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center">
          <AlertCircle className="h-3 w-3 text-amber-500 mr-1" />
          <p className="text-xs text-amber-700">
            Please provide message context to proceed.
          </p>
        </div>
      )}
      
      {!isCreator && isOrgVisible && (isOrgReadOnly() || isReadOnly) && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-center">
          <Lock className="h-3 w-3 text-amber-500 mr-1" />
          <p className="text-xs text-amber-700">
            This agent has organisation-level read-only permissions enabled.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="platformType" className="text-sm font-medium">Platform</Label>
        <Select 
          value={platformType}
          onValueChange={(value) => isFieldEditable('platformType') ? updateField('platformType', value) : null}
          disabled={!isFieldEditable('platformType')}
        >
          <SelectTrigger id="platformType" className={!isFieldEditable('platformType') ? "opacity-70 cursor-not-allowed" : ""}>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {platformOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2 mt-6">
        <Label htmlFor="tone" className="text-sm font-medium">Tone</Label>
        <Select 
          value={tone}
          onValueChange={(value) => isFieldEditable('tone') ? updateField('tone', value) : null}
          disabled={!isFieldEditable('tone')}
        >
          <SelectTrigger id="tone" className={!isFieldEditable('tone') ? "opacity-70 cursor-not-allowed" : ""}>
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            {toneOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2 mt-6">
        <Label htmlFor="messageCount" className="text-sm font-medium">Number of Variants</Label>
        <Select 
          value={messageCount.toString()}
          onValueChange={(value) => isFieldEditable('messageCount') ? updateField('messageCount', parseInt(value)) : null}
          disabled={!isFieldEditable('messageCount')}
        >
          <SelectTrigger id="messageCount" className={!isFieldEditable('messageCount') ? "opacity-70 cursor-not-allowed" : ""}>
            <SelectValue placeholder="Select number of messages" />
          </SelectTrigger>
          <SelectContent>
            {messageCountOptions.map(option => (
              <SelectItem key={option.value.toString()} value={option.value.toString()}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2 mt-6">
        <Label htmlFor="senderName" className="text-sm font-medium">Sender Name</Label>
        <Input
          id="senderName"
          value={senderName}
          onChange={(e) => isFieldEditable('senderName') ? updateField('senderName', e.target.value) : null}
          placeholder="e.g., John Smith"
          className={!isFieldEditable('senderName') ? "opacity-70 cursor-not-allowed" : ""}
          disabled={!isFieldEditable('senderName')}
        />
        <p className="text-xs text-muted-foreground">
          This name will replace [Sender's Name] in the generated messages.
        </p>
      </div>
      
      <div className="space-y-2 mt-6">
        <Label htmlFor="messageContext" className="text-sm font-medium">Message Context</Label>
        <Textarea
          id="messageContext"
          value={messageContext}
          onChange={(e) => isFieldEditable('messageContext') ? updateField('messageContext', e.target.value) : null}
          placeholder="Describe what you want your message to accomplish, who it's for, and any specific points to include..."
          className={`min-h-[150px] ${!isFieldEditable('messageContext') ? "opacity-70 cursor-not-allowed" : ""}`}
          disabled={!isFieldEditable('messageContext')}
          rows={6}
        />
        {showValidation && !messageContext.trim() && (
          <p className="text-sm text-red-500 mt-1">Please provide message context</p>
        )}
        <p className="text-xs text-muted-foreground">
          Be specific about your goals, target audience, and key points to include. 
          The more context you provide, the better your results will be.
        </p>
      </div>

      <div className="mt-6 p-3 bg-muted rounded-md">
        <p className="text-sm font-medium mb-1">Tips for best results:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
          <li>Be specific about your goals and the recipient</li>
          <li>Include relevant details such as the context of your message</li>
          <li>Mention any specific tone or style preferences</li>
        </ul>
      </div>
    </div>
  );
};

export default Step2MessageInput; 