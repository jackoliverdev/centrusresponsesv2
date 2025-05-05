import { AgentSchema, AgentInstanceSchema, AgentType } from 'common';

/**
 * Get capabilities based on agent type
 */
export const getAgentCapabilities = (agentType: AgentType): string[] => {
  const capabilitiesMap: Record<AgentType, string[]> = {
    'message_generator': ['generate_messages', 'analyze_context'],
    'future_agent_type': []
  };
  
  return capabilitiesMap[agentType] || [];
};

/**
 * Check if an agent type supports a specific capability
 */
export const hasCapability = (agentType: AgentType, capability: string): boolean => {
  return getAgentCapabilities(agentType).includes(capability);
};

/**
 * Format the agent instance name for display
 */
export const formatAgentInstanceName = (instance: AgentInstanceSchema): string => {
  return instance.name || 'Unnamed Agent';
};

/**
 * Get the icon for an agent type
 */
export const getAgentIcon = (agentType: string): string => {
  const iconMap: Record<string, string> = {
    'message_generator': 'MessageSquare',
    'future_agent_type': 'Sparkles',
    'default': 'Bot'
  };
  
  return iconMap[agentType] || iconMap.default;
};

/**
 * Type guard for AgentSchema
 */
export const isAgentSchema = (obj: any): obj is AgentSchema => {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'type' in obj &&
    'name' in obj &&
    'description' in obj &&
    'defaultInstructions' in obj &&
    'defaultContext' in obj &&
    'isVisible' in obj
  );
};

/**
 * Type guard for AgentInstanceSchema
 */
export const isAgentInstanceSchema = (obj: any): obj is AgentInstanceSchema => {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'name' in obj &&
    'agentId' in obj
  );
}; 