import { getAPI } from '@/utils/api';
import { API, TeamsChannels } from 'common';
import { useQuery, UseQueryOptions } from 'react-query';

export const useTeamsChannels = (
  options: UseQueryOptions<TeamsChannels | undefined> = {},
) => {
  return useQuery({
    queryKey: ['teams-channels'],
    queryFn: async () => {
      return await getAPI().post(API.getTeamsChannels);
    },
    ...options,
  });
};
