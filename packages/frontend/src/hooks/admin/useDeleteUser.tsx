import { getAPI } from '@/utils/api';
import { API } from 'common';
import { useMutation, useQueryClient } from 'react-query';

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      await getAPI().post(API.adminDeleteUser, { id });
    },
    onSuccess: () => queryClient.invalidateQueries(['organization-users']),
  });
};
