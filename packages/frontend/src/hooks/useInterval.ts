import { useEffect, useRef } from "react";

type CallbackFunction = () => void;

export const useInterval = (
  callback: CallbackFunction,
  interval: number,
): void => {
  const savedCallback = useRef<CallbackFunction>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (interval) {
      const tick = () => {
        if (savedCallback.current) {
          savedCallback.current();
        }
      };
      const id = setInterval(tick, interval);
      return () => clearInterval(id);
    }
  }, [interval]);
};
