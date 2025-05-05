import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useQuery } from 'react-query';
import { useOrganization } from '../admin/useOrganization';

export const useDriveFolders = () => {
  const { data: organization } = useOrganization();
  return useQuery({
    queryKey: ['drive-folders'],
    queryFn: async () => {
      return await getAPI().post(API.driveFolders);
    },
    enabled: !!organization?.google_token,
  });
};
