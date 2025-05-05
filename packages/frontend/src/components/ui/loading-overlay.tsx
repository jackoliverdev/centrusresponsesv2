import { FunctionComponent } from 'react';
import { Loader } from './loader';

export type LoadingOverlayProps = { loading?: boolean };

export const LoadingOverlay: FunctionComponent<LoadingOverlayProps> = ({
  loading,
}) => {
  if (!loading) return null;
  return (
    <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
      <Loader />
    </div>
  );
};
