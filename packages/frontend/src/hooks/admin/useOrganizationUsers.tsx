import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useQuery } from 'react-query';

export const useOrganizationUsers = () => {
  return useQuery({
    queryKey: ['organization-users'],
    queryFn: async () => {
      return (await getAPI().post(API.getOrganizationMembers)) ?? [];
    },
  });
};
