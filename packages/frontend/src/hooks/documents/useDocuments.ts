import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useQuery } from 'react-query';

export const getDocumentsQueryKey = () => ['documents'];
export const useDocuments = () => {
  return useQuery({
    queryKey: getDocumentsQueryKey(),
    queryFn: async () => {
      return getAPI().post(API.getDocuments);
    },
  });
};
