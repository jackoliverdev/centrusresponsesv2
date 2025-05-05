import { useRouter } from "next/router";
import { NextPage } from "next";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/layouts/app/AppLayout";
import { useAgentInstances } from "@/hooks/useAgentInstances";
import { useAgents } from "@/hooks/useAgents";
import { USER_APP_ROUTES } from "@/routing/routes";
import { ArrowLeft, ArrowRight, ChevronLeft, Save, Download, ExternalLink, AlertCircle, CreditCard } from "lucide-react";

import Step1MessageGeneratorSetup from "@/components/app/Agents/MessageGenerator/Step1MessageGeneratorSetup";
import Step2MessageInput from "@/components/app/Agents/MessageGenerator/Step2MessageInput";
import Step3DocumentUpload from "@/components/app/Agents/MessageGenerator/Step3DocumentUpload";
import Step4MessageResults from "@/components/app/Agents/MessageGenerator/Step4MessageResults";
import useMessageGenerator from "@/hooks/useMessageGenerator";
import { API } from 'common';
import { getAPI } from '@/utils/api';
import { message, notification } from "antd";
import { usePlan } from "@/hooks/plan/usePlan";
import { FieldPermissionsButton } from '@/components/app/Agents/FieldPermissionsButton';
import { useAgentInstanceOrganizationFieldPermissions } from '@/hooks/useAgentInstanceOrganizationFieldPermissions';

// Agent credit costs
const AGENT_CREDIT_COSTS = {
  'message_generator': 1
};

// Define field definitions
const messageGeneratorFieldDefinitions = [
  // Step 1 fields
  {
    name: 'name',
    label: 'Instance Name',
    description: 'The name of this agent instance',
    step: 1
  },
  {
    name: 'instructions',
    label: 'Instructions',
    description: 'Instructions for generating messages',
    step: 1
  },
  {
    name: 'context',
    label: 'Additional Context',
    description: 'Background information or context for the agent',
    step: 1
  },
  // Step 2 fields
  {
    name: 'platformType',
    label: 'Platform Type',
    description: 'Type of platform for the message',
    step: 2
  },
  {
    name: 'customPlatformType',
    label: 'Custom Platform Type',
    description: 'Custom platform type (if "Custom" is selected)',
    step: 2
  },
  {
    name: 'messageCount',
    label: 'Message Count',
    description: 'Number of message variations to generate',
    step: 2
  },
  {
    name: 'tone',
    label: 'Tone',
    description: 'Tone of the message',
    step: 2
  },
  {
    name: 'senderName',
    label: 'Sender Name',
    description: 'Name of the message sender',
    step: 2
  },
  {
    name: 'messageContext',
    label: 'Message Context',
    description: 'Context information for message generation',
    step: 2
  },
];

const AgentInstancePage: NextPage = () => {
  const router = useRouter();
  const { type, instanceId } = router.query;
  const [currentStep, setCurrentStep] = useState(1);
  const [agent, setAgent] = useState<any>(null);
  const [instance, setInstance] = useState<any>(null);
  
  // Message generator states
  const [messageContext, setMessageContext] = useState('');
  const [platformType, setPlatformType] = useState('generic');
  const [messageCount, setMessageCount] = useState(1);
  const [tone, setTone] = useState('professional');
  const [senderName, setSenderName] = useState('');
  const [messageResults, setMessageResults] = useState<Array<{ type: string; content: string }>>([]);
  const [showMessageValidation, setShowMessageValidation] = useState(false);
  
  // Shared states
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get plan information to check message credits
  const { data: planData, isLoading: isLoadingPlan, refetch: refetchPlanData } = usePlan();
  const { usages, usageLimits } = planData || {};

  const { data: agents } = useAgents();
  const { instances, updateInstance } = useAgentInstances(type as string);
  const { data: instancesData, refetch: refetchInstances } = instances;
  const { runGenerator } = useMessageGenerator();

  // Add this to determine if the current user is the creator
  const [isCreator, setIsCreator] = useState(false);
  const [currentUserOrganizationId, setCurrentUserOrganizationId] = useState<number | null>(null);
  
  // Check if there are enough message credits
  const hasEnoughCredits = useMemo(() => {
    const messageUsage = usages?.messages ?? 0;
    const messageLimit = usageLimits?.messages ?? 0;
    const agentType = type as keyof typeof AGENT_CREDIT_COSTS;
    const requiredCredits = AGENT_CREDIT_COSTS[agentType] || 1;
    
    return messageUsage + requiredCredits <= messageLimit;
  }, [usages, usageLimits, type]);

  // Function to refresh instance data from the database
  const refreshInstanceData = useCallback(async () => {
    if (instanceId) {
      const result = await refetchInstances();
      // Update current instance state with the freshly fetched data
      if (result?.data) {
        const freshInstance = result.data.find(i => i.id.toString() === instanceId);
        if (freshInstance) {
          setInstance(freshInstance);
          
          // Load platform-specific settings from context
          if (type === 'message_generator' && freshInstance.context) {
            try {
              const contextData = JSON.parse(freshInstance.context);
              if (contextData.platformType) {
                setPlatformType(contextData.platformType);
              }
              if (contextData.tone) {
                setTone(contextData.tone);
              }
              if (contextData.messageCount) {
                setMessageCount(contextData.messageCount);
              }
              if (contextData.messageContext) {
                setMessageContext(contextData.messageContext);
              }
              if (contextData.senderName) {
                setSenderName(contextData.senderName);
              }
            } catch (e) {
              // If not valid JSON or doesn't have settings, just keep the default
              console.log('No settings found in context');
            }
          }
        }
      }
    }
  }, [instanceId, refetchInstances, type]);

  useEffect(() => {
    if (agents) {
      const foundAgent = agents.find(a => a.type === type);
      if (foundAgent) setAgent(foundAgent);
    }
  }, [agents, type]);

  // Effect to reload instance data when moving between steps
  useEffect(() => {
    // Immediately refresh instance data when moving between steps
    refreshInstanceData();
  }, [currentStep, refreshInstanceData]);

  // Update page title when instance name changes
  useEffect(() => {
    if (instance?.name && document) {
      document.title = `${instance.name} - Message Generator`;
    }
  }, [instance?.name]);

  // Inside the AgentInstancePage component, update the useEffect that loads the instance data
  useEffect(() => {
    if (instancesData && instanceId) {
      const currentInstance = instancesData.find(i => i.id.toString() === instanceId);
      if (currentInstance) {
        setInstance(currentInstance);
        
        // Parse context data to get saved values
        try {
          if (currentInstance.context) {
            const contextData = JSON.parse(currentInstance.context);
            
            // Set platform type if it exists
            if (contextData.platformType) {
              setPlatformType(contextData.platformType);
            }
            
            // Set tone if it exists
            if (contextData.tone) {
              setTone(contextData.tone);
            }
            
            // Set message count if it exists
            if (contextData.messageCount) {
              setMessageCount(contextData.messageCount);
            }
            
            // Set saved selected documents if they exist
            if (contextData.selectedDocuments && Array.isArray(contextData.selectedDocuments)) {
              setSelectedDocuments(contextData.selectedDocuments);
            }
          }
        } catch (error) {
          console.error('Error parsing context data:', error);
        }
        
        // Check if current user is the creator
        const { post } = getAPI();
        post(API.getOrCreateUser).then(user => {
          if (user) {
            setIsCreator(user.id === currentInstance.createdBy);
            setCurrentUserOrganizationId(user.organizationId);
          }
        });
      }
    }
  }, [instancesData, instanceId]);

  const handleNextStep = () => {
    if (type === 'message_generator' && currentStep === 2) {
      // Check if message context has content
      if (!messageContext.trim()) {
        setShowMessageValidation(true); // Show validation on attempt to proceed
        message.error({
          content: (
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>Please provide message context before proceeding</span>
            </div>
          ),
          duration: 3
        });
        return;
      }
    }
    
    if (currentStep < 4) {
      setShowMessageValidation(false);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setShowMessageValidation(false);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRunGenerator = async () => {
    if (!instance || !messageContext.trim()) return;
    
    // Check if we have enough message credits
    if (!hasEnoughCredits) {
      notification.error({
        description: "Chat limits exceeded, subscribe to a plan or buy add-on messages",
        message: "Limits Reached",
        btn: (
          <Button
            size="sm"
            color="primary"
            variant="link"
            onClick={() => router.push(USER_APP_ROUTES.getPath("settingsBilling"))}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Go to Billing
          </Button>
        ),
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save the selected documents to context
      if (instance) {
        try {
          let contextData = {};
          try {
            if (instance.context) {
              contextData = JSON.parse(instance.context);
            }
          } catch (e) {
            console.error('Failed to parse context:', e);
          }
          
          // Update with selected documents
          const updatedContext = JSON.stringify({
            ...contextData,
            selectedDocuments,
            platformType,
            tone,
            messageCount
          });
          
          // Update in database (don't await to avoid blocking generation)
          updateInstance.mutate({
            id: instance.id,
            context: updatedContext
          });
        } catch (error) {
          console.error('Failed to save selected documents:', error);
        }
      }
      
      // Call message generator API with selected documents
      const result = await runGenerator.mutateAsync({
        instanceId: parseInt(instanceId as string),
        messageContext,
        platformType,
        numberOfVariants: messageCount,
        senderName,
        documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined
      });

      if (result) {
        console.log('Full API Response:', JSON.stringify(result, null, 2));
        console.log('Messages from API (detailed):', JSON.stringify(result.results.messages, null, 2));
        setMessageResults(result.results.messages);
        console.log('State after setting messages:', JSON.stringify(messageResults, null, 2));
        setCurrentStep(4);
        
        // Refresh instances and plan data to update message count
        await refetchInstances();
        // Refetch plan data to update usage limits
        refetchPlanData();
      }
    } catch (error) {
      console.error("Failed to process request:", error);
      message.error("Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResult = () => {
    const element = document.createElement('a');
    const content = messageResults.map(msg => msg.content).join('\n\n---\n\n');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `message-variants-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Message generator context handlers
  const handlePlatformTypeChange = useCallback(async (newPlatformType: string) => {
    setPlatformType(newPlatformType);
    
    // Save to database
    if (instance) {
      try {
        // Parse existing context or create new object
        let contextData = {};
        try {
          if (instance.context) {
            contextData = JSON.parse(instance.context);
          }
        } catch (e) {
          console.error('Failed to parse context:', e);
        }
        
        // Update with new platform type
        const updatedContext = JSON.stringify({
          ...contextData,
          platformType: newPlatformType
        });
        
        // Update in database
        await updateInstance.mutateAsync({
          id: instance.id,
          context: updatedContext
        });
        
        // Update local instance
        setInstance((prev: any) => ({
          ...prev,
          context: updatedContext
        }));
      } catch (error) {
        console.error('Failed to update platform type:', error);
      }
    }
  }, [instance, updateInstance]);

  const handleToneChange = useCallback(async (newTone: string) => {
    setTone(newTone);
    
    // Save to database
    if (instance) {
      try {
        // Parse existing context or create new object
        let contextData = {};
        try {
          if (instance.context) {
            contextData = JSON.parse(instance.context);
          }
        } catch (e) {
          console.error('Failed to parse context:', e);
        }
        
        // Update with new tone
        const updatedContext = JSON.stringify({
          ...contextData,
          tone: newTone
        });
        
        // Update in database
        await updateInstance.mutateAsync({
          id: instance.id,
          context: updatedContext
        });
        
        // Update local instance
        setInstance((prev: any) => ({
          ...prev,
          context: updatedContext
        }));
      } catch (error) {
        console.error('Failed to update tone:', error);
      }
    }
  }, [instance, updateInstance]);

  const handleMessageCountChange = useCallback(async (newCount: number) => {
    setMessageCount(newCount);
    
    // Save to database
    if (instance) {
      try {
        // Parse existing context or create new object
        let contextData = {};
        try {
          if (instance.context) {
            contextData = JSON.parse(instance.context);
          }
        } catch (e) {
          console.error('Failed to parse context:', e);
        }
        
        // Update with new message count
        const updatedContext = JSON.stringify({
          ...contextData,
          messageCount: newCount
        });
        
        // Update in database
        await updateInstance.mutateAsync({
          id: instance.id,
          context: updatedContext
        });
        
        // Update local instance
        setInstance((prev: any) => ({
          ...prev,
          context: updatedContext
        }));
      } catch (error) {
        console.error('Failed to update message count:', error);
      }
    }
  }, [instance, updateInstance]);

  const handleMessageContextChange = useCallback(async (newContext: string) => {
    setMessageContext(newContext);
    
    // Save to database
    if (instance) {
      try {
        // Parse existing context or create new object
        let contextData = {};
        try {
          if (instance.context) {
            contextData = JSON.parse(instance.context);
          }
        } catch (e) {
          console.error('Failed to parse context:', e);
        }
        
        // Update with new message context
        const updatedContext = JSON.stringify({
          ...contextData,
          messageContext: newContext
        });
        
        // Update in database - don't await to avoid delaying typing
        updateInstance.mutate({
          id: instance.id,
          context: updatedContext
        });
      } catch (error) {
        console.error('Failed to update message context:', error);
      }
    }
  }, [instance, updateInstance]);

  const handleSenderNameChange = useCallback(async (newSenderName: string) => {
    setSenderName(newSenderName);
    
    // Save to database
    if (instance) {
      try {
        // Parse existing context or create new object
        let contextData = {};
        try {
          if (instance.context) {
            contextData = JSON.parse(instance.context);
          }
        } catch (e) {
          console.error('Failed to parse context:', e);
        }
        
        // Update with new sender name
        const updatedContext = JSON.stringify({
          ...contextData,
          senderName: newSenderName
        });
        
        // Update in database
        await updateInstance.mutateAsync({
          id: instance.id,
          context: updatedContext
        });
        
        // Update local instance
        setInstance((prev: any) => ({
          ...prev,
          context: updatedContext
        }));
      } catch (error) {
        console.error('Failed to update sender name:', error);
      }
    }
  }, [instance, updateInstance]);

  // For all steps, we need instance data
  if (!agent || !instance) {
    return (
      <AppLayout currentItemId="agents">
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1MessageGeneratorSetup 
            instance={instance} 
            onInstanceUpdate={(updatedInstance) => setInstance(updatedInstance)} 
          />
        );
      case 2:
        return (
          <Step2MessageInput 
            messageContext={messageContext}
            setMessageContext={handleMessageContextChange}
            platformType={platformType}
            setPlatformType={handlePlatformTypeChange}
            customPlatformType={''}
            setCustomPlatformType={() => {}}
            messageCount={messageCount}
            setMessageCount={handleMessageCountChange}
            tone={tone}
            setTone={handleToneChange}
            senderName={senderName}
            setSenderName={handleSenderNameChange}
            showValidation={showMessageValidation}
            instanceId={instanceId ? parseInt(instanceId as string) : undefined}
            isOrgVisible={instance.isOrgVisible}
            isReadOnly={instance.isReadOnly}
          />
        );
      case 3:
        return (
          <Step3DocumentUpload 
            selectedDocuments={selectedDocuments}
            setSelectedDocuments={setSelectedDocuments}
            instanceId={instanceId ? parseInt(instanceId as string) : undefined}
            fieldDefinitions={messageGeneratorFieldDefinitions}
          />
        );
      case 4:
        return (
          <>
            <Step4MessageResults 
              results={{
                messages: messageResults || [],
                platformType: platformType
              }} 
              isLoading={isLoading}
              selectedDocuments={selectedDocuments}
            />
          </>
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === 3;
  const isResultStep = currentStep === 4;

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Configure";
      case 2: return "Message Details";
      case 3: return "Additional Documents";
      case 4: return "Message Results";
      default: return "";
    }
  };

  // Create the Back to Instances button for the header
  const backToInstancesButton = (
    <Button
      variant="outline"
      onClick={() => router.push(USER_APP_ROUTES.getPath("agentType", { type: type as string }))}
      className="h-10"
    >
      Back to Instances
    </Button>
  );

  // Display credit cost information in the agent UI
  const renderCreditCostInfo = () => {
    if (!type) return null;
    
    const agentType = type as keyof typeof AGENT_CREDIT_COSTS;
    const creditCost = AGENT_CREDIT_COSTS[agentType] || 1;
    
    return (
      <div className="text-sm text-muted-foreground mb-4 flex items-center">
        <CreditCard className="h-4 w-4 mr-1" />
        <span>This agent uses <strong>{creditCost}</strong> message {creditCost === 1 ? 'credit' : 'credits'} each time it runs.</span>
      </div>
    );
  };

  return (
    <AppLayout 
      currentItemId="agents"
      subtitle={instance.name}
      headerClassName="border-b border-b-gray-200"
      action={
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={() => router.push(USER_APP_ROUTES.getPath("agentType", { type: type as string }))}
          >
            Back to Instances
          </Button>
        </div>
      }
    >
      <div className="container py-0">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">{getStepTitle()}</h2>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {isResultStep ? 4 : 3}
            </div>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (isResultStep ? 4 : 3)) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* Display credit cost information before step content */}
          {currentStep === 1 && renderCreditCostInfo()}
          
          {renderStep()}
        </div>

        <div className="flex justify-between mt-6">
          {currentStep === 1 ? (
            <Button
              variant="outline"
              onClick={() => router.push(USER_APP_ROUTES.getPath("agentType", { type: type as string }))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Instances
            </Button>
          ) : isResultStep ? (
            <Button
              variant="outline"
              onClick={handlePreviousStep}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handlePreviousStep}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          {isLastStep ? (
            <Button
              onClick={handleRunGenerator}
              disabled={isLoading || !messageContext.trim() || !hasEnoughCredits}
            >
              {isLoading ? "Processing..." : "Generate Messages"}
              {!hasEnoughCredits && " (Not enough credits)"}
            </Button>
          ) : !isResultStep ? (
            <Button onClick={handleNextStep}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleDownloadResult}>
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AgentInstancePage;