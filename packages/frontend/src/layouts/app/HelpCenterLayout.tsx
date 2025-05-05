import { FunctionComponent, PropsWithChildren } from "react";
import { AppLayout } from "./AppLayout";

export type Props = object;

export const HelpCenterLayout: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
}) => {
  return <AppLayout currentItemId="help">{children}</AppLayout>;
};
