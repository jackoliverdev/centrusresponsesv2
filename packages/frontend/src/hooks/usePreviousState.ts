import { useEffect, useRef } from "react";

/**
 * Keeps track of the value of `value` before it's
 * last change.
 */
export function usePreviousState<T>(value: T): T {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
