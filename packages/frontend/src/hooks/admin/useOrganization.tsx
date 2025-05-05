import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useQuery } from 'react-query';

export const getOrganizationQueryKey = () => ['organization'];

export const useOrganization = () => {
  return useQuery({
    queryKey: getOrganizationQueryKey(),
    queryFn: async () => {
      return await getAPI().post(API.getOrganization);
    },
  });
};
