import { getAPI } from '@/utils/api';
import { notification } from 'antd';
import { API, UpdateOrganizationDto } from 'common';
import { useMutation, useQueryClient } from 'react-query';
import { getOrganizationQueryKey } from './useOrganization';

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organization: UpdateOrganizationDto) => {
      await getAPI().post(API.updateOrganization, organization);
    },
    onError: (e) => {
      notification.error({
        message: e instanceof Error ? e.message : 'Something went wrong',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(getOrganizationQueryKey());
      notification.success({
        message: 'Updated',
      });
    },
  });
};
