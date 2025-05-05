import { FunctionComponent, HTMLProps } from 'react';
import { twMerge } from 'tailwind-merge';

export type HeadingProps = HTMLProps<HTMLHeadingElement>;

export const Heading: FunctionComponent<HeadingProps> = ({
  className,
  ...props
}) => {
  return (
    <h2
      className={twMerge(
        'text-2xl font-bold mb-3 flex items-center gap-2',
        className,
      )}
      {...props}
    />
  );
};
