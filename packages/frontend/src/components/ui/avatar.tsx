import { UserOutlined } from '@ant-design/icons';
import { Avatar as AntdAvatar, AvatarProps as AntdAvatarProps } from 'antd';

import { FunctionComponent } from 'react';

export type AvatarProps = AntdAvatarProps;

export const Avatar: FunctionComponent<AvatarProps> = ({ src, ...props }) => {
  return (
    <AntdAvatar
      icon={<UserOutlined />}
      src={src ? src : undefined}
      {...props}
    />
  );
};
