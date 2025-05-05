import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useQuery } from 'react-query';

export const getAdminStatsQueryKey = () => ['admin-stats'];

export const useAdminStats = () => {
  return useQuery({
    queryKey: getAdminStatsQueryKey(),
    queryFn: async () => {
      return await getAPI().post(API.getAdminStats);
    },
  });
};
