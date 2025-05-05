import { NextPage } from 'next';
import { useEffect } from 'react';
import { AppLayout } from '@/layouts/app/AppLayout';
import { useAgents } from '@/hooks/useAgents';
import AgentCard from '@/components/app/Agents/AgentCard';
import CustomAgentCard from '@/components/app/Agents/CustomAgentCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AgentsPage: NextPage = () => {
  const { data: agents, isLoading, error } = useAgents();

  // Log errors to console for debugging
  useEffect(() => {
    if (error) {
      console.error('Error loading agents:', error);
    }
  }, [error]);

  // Function to order agents with message_generator first
  const getOrderedAgents = () => {
    if (!agents) return [];
    
    // Sort to ensure Request Custom Agent is first, then message_generator
    return [...agents].sort((a, b) => {
      // Request Custom Agent should always be first
      if (a.name === "Request Custom Agent") return -1;
      if (b.name === "Request Custom Agent") return 1;
      
      // Then message_generator type
      if (a.type === 'message_generator') return -1;
      if (b.type === 'message_generator') return 1;
      
      // Then alphabetically by name for the rest
      return a.name.localeCompare(b.name);
    });
  };

  return (
    <AppLayout 
      currentItemId="agents" 
      subtitle="Use AI-powered agents to automate tasks and gain insights from your data."
    >
      <div className="container py-0">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse h-[320px]">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">
              Unable to load agents. Please try again later.
            </p>
            <div className="mb-4">
              <pre className="text-left bg-gray-100 p-4 rounded text-sm overflow-auto max-w-xl mx-auto">
                {error instanceof Error ? error.message : String(error)}
              </pre>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : agents?.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              No agents are available at this time. Check back later for new features.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getOrderedAgents().map(agent => (
              agent.name === "Request Custom Agent" ? 
                <CustomAgentCard key={agent.id} agent={agent} /> : 
                <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AgentsPage; 