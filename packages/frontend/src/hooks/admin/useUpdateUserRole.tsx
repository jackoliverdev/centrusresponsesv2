import { getAPI } from '@/utils/api';
import { API, UserRole } from 'common';
import { useMutation, useQueryClient } from 'react-query';

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: number; role: UserRole }) => {
      await getAPI().post(API.changeMemberRoleInOrganization, {
        role,
        userId: id,
      });
    },
    onSuccess: () => queryClient.invalidateQueries(['organization-users']),
  });
};
