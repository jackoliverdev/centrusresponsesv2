import { editEmployee } from '@/components/app/EditEmployee/action';
import { uploadUserImage } from '@/storage/user';
import { useMutation, useQueryClient } from 'react-query';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
      image,
    }: {
      id: number;
      data: Parameters<typeof editEmployee>[1];
      image?: File;
    }) => {
      const temp = { ...data };
      if (image) temp.image = await uploadUserImage(image);
      return editEmployee(id, temp);
    },
    onSuccess: () => queryClient.invalidateQueries(['organization-users']),
  });
};
