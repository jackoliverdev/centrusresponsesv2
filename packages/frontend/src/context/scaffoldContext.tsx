import { createContext, FunctionComponent, PropsWithChildren } from "react";
import { useSafeContext } from "@/hooks/useSafeContext";

export type ContextValueHook<ContextValue, ProviderProps> = (
  props: ProviderProps,
) => ContextValue;

export function scaffoldContext<ContextValue, ProviderProps>(
  useContextValueHook: ContextValueHook<ContextValue, ProviderProps>,
) {
  const Context = createContext<ReturnType<typeof useContextValueHook> | null>(
    null,
  );

  const ContextProvider: FunctionComponent<
    PropsWithChildren<ProviderProps>
  > = ({ children, ...props }) => {
    const value = useContextValueHook(props as ProviderProps);
    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useContext = () => useSafeContext(Context);

  return [ContextProvider, useContext] as const;
}
