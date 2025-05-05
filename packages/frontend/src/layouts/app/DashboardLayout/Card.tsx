import { FunctionComponent, HTMLProps } from 'react';
import { twMerge } from 'tailwind-merge';

export type CardProps = HTMLProps<HTMLDivElement>;

export const Card: FunctionComponent<CardProps> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge('border rounded-lg bg-white', className)}
      {...props}
    />
  );
};
