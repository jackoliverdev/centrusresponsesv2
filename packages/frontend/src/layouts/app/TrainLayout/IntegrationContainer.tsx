import { FunctionComponent } from 'react';
import { twMerge } from 'tailwind-merge';

export type IntegrationContainerProps = {
  children: React.ReactNode;
  as?: React.ElementType;
} & React.ComponentPropsWithRef<'div'>;

export const IntegrationContainer: FunctionComponent<
  IntegrationContainerProps
> = ({ children, className, as: As = 'div', ...props }) => {
  return (
    <As
      className={twMerge(
        'bg-white rounded border flex items-center justify-center flex-col gap-4 flex-1 py-8 px-4 transition',
        As == 'button' && 'hover:shadow hover:bg-neutral-50',
        className,
      )}
      {...props}
    >
      {children}
    </As>
  );
};
