import { useEffect, useState } from "react";

import { usePreviousState } from "@/hooks/usePreviousState";
import { isEqual } from "lodash";
/**
 * Calls a callback when a state value changes (or rather, it's
 * JSON-serialized value).
 *
 * This hook is useful in cases where you'd use `useEffect` but
 * the object-comparison is triggering the effect more often than
 * what you need, which is almost every time where your effect is not
 * idempotent (https://en.wikipedia.org/wiki/Idempotence).
 */
// eslint-disable-next-line
export function useOnStateChange<StateType = any>(
  state: StateType,
  // eslint-disable-next-line
  callback: (newState?: StateType, oldState?: StateType) => any,
  onCondition?: boolean,
): [StateType, StateType] {
  const previousState = usePreviousState<StateType>(state);

  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    if (typeof onCondition === "boolean" && !onCondition) return;

    if (!isEqual(state, previousState) && !isFirstTime) {
      callback(state, previousState);
    }
    setIsFirstTime(false);
  }, [onCondition, state, callback, previousState, isFirstTime]);

  return [state, previousState];
}
