import { FunctionComponent, HTMLProps } from 'react';
import { twMerge } from 'tailwind-merge';

export type CardProps = HTMLProps<HTMLDivElement>;

export const Card: FunctionComponent<CardProps> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(
        'p-4 flex flex-col gap-4 bg-white rounded-xl border',
        className,
      )}
      {...props}
    />
  );
};
