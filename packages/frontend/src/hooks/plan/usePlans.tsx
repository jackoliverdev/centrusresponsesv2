import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useQuery } from 'react-query';

export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      return (await getAPI().post(API.getPlans)) ?? [];
    },
  });
};
