import { useAuthContext } from '@/context/AuthContext';
import { useUpdateUser } from '@/hooks/user/useUpdateUser';
import { Button, Upload } from 'antd';
import { FunctionComponent } from 'react';
import { LoadingOverlay } from '../ui/loading-overlay';
import { Avatar } from '../ui/avatar';

export type UpdateProfileImage = object;

export const UpdateProfileImage: FunctionComponent<UpdateProfileImage> = () => {
  const { mutate: updateUser, isLoading } = useUpdateUser();

  const { user } = useAuthContext();
  const existingImage = user?.image;

  return (
    <div className="relative">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Profile Picture</h2>
        <p className="text-sm text-gray-500">Update your profile picture</p>
      </div>
      <div className="w-full flex items-center gap-x-4">
        <Avatar size={64} src={existingImage} className="shrink-0" />
        <div className="flex gap-x-2 items-center">
          <Upload
            beforeUpload={(file) => {
              updateUser({ newImage: file });
              return false;
            }}
            accept=".png,.jpeg,.jpg"
            showUploadList={false}
          >
            <Button>Upload new</Button>
          </Upload>
          {existingImage && (
            <Button onClick={() => updateUser({ image: '' })} danger>
              Remove
            </Button>
          )}
        </div>
      </div>
      <LoadingOverlay loading={isLoading} />
    </div>
  );
};
