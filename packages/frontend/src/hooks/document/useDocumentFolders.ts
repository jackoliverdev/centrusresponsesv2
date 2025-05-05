import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useQuery } from 'react-query';

export const getDocumentFoldersQueryKey = () => ["document-folders"];

export const useDocumentFolders = () => {
  return useQuery({
    queryKey: getDocumentFoldersQueryKey(),
    queryFn: async () => {
      return getAPI().post(API.getDocumentFolders);
    },
  });
}; 