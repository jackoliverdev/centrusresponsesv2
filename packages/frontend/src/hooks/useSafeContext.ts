import type { Context } from "react";
import { useContext } from "react";

export function useSafeContext<ContextValue>(
  context: Context<ContextValue | null>,
) {
  const safeContext = useContext(context);
  if (!safeContext) {
    throw new Error(`You can't use useContext outside of the provider`);
  }
  return safeContext;
}
