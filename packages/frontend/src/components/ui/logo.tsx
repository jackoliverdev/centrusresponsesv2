import { FunctionComponent, HTMLProps } from 'react';

export type LogoProps = HTMLProps<HTMLImageElement> & { iconOnly?: boolean };

export const Logo: FunctionComponent<LogoProps> = ({ iconOnly, ...props }) => {
  return (
    <img
      src={iconOnly ? '/images/logo-icon.png' : '/images/logo.png'}
      alt="Centrus"
      {...props}
    />
  );
};
