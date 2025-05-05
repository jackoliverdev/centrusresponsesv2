import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { AgentSchema, AgentInstanceSchema } from 'common';

interface AgentContextType {
  selectedAgent: AgentSchema | null;
  selectedInstance: AgentInstanceSchema | null;
  setSelectedAgent: (agent: AgentSchema | null) => void;
  setSelectedInstance: (instance: AgentInstanceSchema | null) => void;
  clearSelections: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider = ({ children }: { children: ReactNode }) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentSchema | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<AgentInstanceSchema | null>(null);

  const clearSelections = useCallback(() => {
    setSelectedAgent(null);
    setSelectedInstance(null);
  }, []);

  return (
    <AgentContext.Provider
      value={{
        selectedAgent,
        selectedInstance,
        setSelectedAgent,
        setSelectedInstance,
        clearSelections,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgentContext = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
}; 