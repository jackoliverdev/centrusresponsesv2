import { uploadUserImage } from '@/storage/user';
import { getAPI } from '@/utils/api';
import { API, RequestBodyType } from 'common';
import { useMutation, useQueryClient } from 'react-query';

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: Omit<RequestBodyType<typeof API.adminCreateUser>, 'image'> & {
        image?: File;
      },
    ) => {
      const getUrl = async () =>
        data.image ? await uploadUserImage(data.image) : '';
      const url = await getUrl();
      await getAPI().post(API.adminCreateUser, { ...data, image: url });
    },
    onSuccess: () => queryClient.invalidateQueries(['organization-users']),
  });
};
