import { FunctionComponent, PropsWithChildren } from "react";
import { Loading } from "@/components/common/Loading";

type LoadingLayoutProps = {};

export const LoadingLayout: FunctionComponent<
  PropsWithChildren<LoadingLayoutProps>
> = () => {
  return <Loading className="h-screen" />;
};
