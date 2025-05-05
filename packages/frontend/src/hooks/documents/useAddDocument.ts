import { uploadDocument } from '@/storage';
import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query';
import { getDocumentsQueryKey } from './useDocuments';
import { mutationErrorHandler } from '@/utils/error';

type TVariables = {
  id: string;
  file: File;
  type: 'text' | 'audio';
};
export const useAddDocument = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, unknown, TVariables, unknown> = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, type }: TVariables) => {
      const path = await uploadDocument(file);
      await getAPI().post(API.addDocument, {
        name: file.name,
        path: path,
        type,
      });
    },
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries(getDocumentsQueryKey());
      onSuccess?.(...args);
    },
    onError: (...args) => {
      mutationErrorHandler(args[0]);
      onError?.(...args);
    },
    ...options,
  });
};
