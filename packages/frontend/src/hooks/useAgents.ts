import { useQuery } from 'react-query';
import { AgentSchema, getAllAgents } from 'common';
import { getAPI } from '@/utils/api';

export function useAgents() {
  return useQuery<AgentSchema[]>(
    ['agents'],
    async () => {
      const { post } = getAPI();
      const data = await post(getAllAgents);
      return data || [];
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );
} 