import { ReactNode } from 'react';

export type NavigationItem = {
  id: string;
  name: string;
  title?: string;
  subtitle?: string;
  Icon: any; // TODO: type this
  path?: string;
  externalHref?: string;
  content?: ReactNode;
  adminOnly?: boolean;
};
