import { useMutation, useQueryClient } from 'react-query';
import { getAPI } from '@/utils/api';
import { API } from 'common';
import { getDocumentFoldersQueryKey } from './useDocumentFolders';

export const useCreateDocumentFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      params: ReturnType<typeof API.createDocumentFolder.getTypedRequestBody>,
    ) => getAPI().post(API.createDocumentFolder, params),
    onSuccess: () => queryClient.invalidateQueries(getDocumentFoldersQueryKey()),
  });
}; 