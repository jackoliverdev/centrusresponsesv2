import { Loader2, LucideProps } from 'lucide-react';
import { FunctionComponent } from 'react';
import { twMerge } from 'tailwind-merge';

export type LoaderProps = LucideProps;

export const Loader: FunctionComponent<LoaderProps> = ({ className }) => {
  return (
    <Loader2
      className={twMerge('size-6 animate-spin text-primary', className)}
    />
  );
};
