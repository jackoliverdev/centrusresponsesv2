import { FC, useState } from 'react';
import { ArrowRight, Bot, MessageSquare, ExternalLink, PlayCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { USER_APP_ROUTES } from '@/routing/routes';
import { Badge } from '@/components/ui/badge';
import { AgentSchema } from 'common';
import { Modal, Button } from 'antd';

// Define credit costs for different agent types
const AGENT_CREDIT_COSTS = {
  'message_generator': 1
};

interface AgentCardProps {
  agent: AgentSchema;
}

const AgentCard: FC<AgentCardProps> = ({ agent }) => {
  const [infoVisible, setInfoVisible] = useState(false);
  
  const showInfo = () => {
    setInfoVisible(true);
  };

  const hideInfo = () => {
    setInfoVisible(false);
  };
  
  // Get the appropriate icon based on agent type
  const getIcon = () => {
    if (agent.type === 'message_generator') {
      return (
        <div className="bg-blue-600 rounded-full p-2">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
      );
    }
    // Default icon for other agent types
    return (
      <div className="bg-blue-600 rounded-full p-2">
        <Bot className="h-6 w-6 text-white" />
      </div>
    );
  };

  // Function to determine if agent is new (created in the last 30 days)
  const isNewAgent = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const createdAt = new Date(agent.createdAt);
    return createdAt > thirtyDaysAgo;
  };

  // Get agent name with proper formatting
  const getAgentName = () => {
    if (agent.type === 'message_generator') {
      return 'Message Generator';
    }
    return agent.name;
  };

  // Get description for agent
  const getAgentDescription = () => {
    // Always use the description from Supabase data
    return agent.description;
  };

  // Get capabilities based on agent type
  const getCapabilities = () => {
    if (agent.type === 'message_generator') {
      return [
        'Generate platform-specific messages',
        'Create multiple message variants',
        'Optimise for engagement and conversion'
      ];
    }
    
    return ['Perform AI-powered tasks'];
  };

  // Get credit cost for this agent type
  const getCreditCost = () => {
    const agentType = agent.type as keyof typeof AGENT_CREDIT_COSTS;
    return AGENT_CREDIT_COSTS[agentType] || 1;
  };

  return (
    <>
      <div className="group flex flex-col hover:shadow-sm transition-shadow border border-border bg-white rounded-md p-4 h-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-xl text-foreground font-bold">{getAgentName()}</h2>
          </div>
          <Badge className="bg-blue-600 text-white border-0">
            Active
          </Badge>
        </div>
        
        <p className="mt-2 text-sm text-muted-foreground">
          {getAgentDescription()}
        </p>
        
        {/* Add credit cost information */}
        <div className="mt-2 flex items-center text-sm text-blue-500">
          <CreditCard className="h-4 w-4 mr-1" />
          <span>Uses <strong>{getCreditCost()}</strong> message {getCreditCost() === 1 ? 'credit' : 'credits'}</span>
        </div>
        
        <div className="flex-grow mt-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold">This agent can help you:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
              {getCapabilities().map((capability, index) => (
                <li key={index}>{capability}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-6 flex gap-2">
          <Link 
            href={USER_APP_ROUTES.getPath("agentType", { type: agent.type })}
            className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            <span>Use Agent</span>
          </Link>
          <Link 
            href={USER_APP_ROUTES.getPath('helpCenterArticles')}
            className="w-1/2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded flex items-center justify-center"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Learn More</span>
          </Link>
        </div>
      </div>
      
      <Modal
        title={`How to use ${getAgentName()}`}
        open={infoVisible}
        onCancel={hideInfo}
        width={600}
        footer={[
          <Button key="close" onClick={hideInfo}>
            Close
          </Button>,
        ]}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      >
        <div className="text-sm mb-4">
          <ol className="list-decimal pl-4 my-3 space-y-2">
            <li>Navigate to the agent page by clicking "Use Agent"</li>
            <li>Follow the setup instructions for your specific use case</li>
            <li>Upload or connect your data sources as needed</li>
            <li>Review the AI-generated insights and suggestions</li>
          </ol>
        </div>
      </Modal>
    </>
  );
}

export default AgentCard;