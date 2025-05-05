import { useEffect, useRef } from "react";

// eslint-disable-next-line
type Callback = (...args: any[]) => any;

type UseOnMountActionParams = {
  onMountAction: Callback;
  onUnmountAction?: Callback;

  // Will not perform the mount action until `awaitForCondition` is true
  awaitForCondition?: boolean;
};

/**
 * Makes sure that the `onMountAction` is only performed once -- when
 * the component renders.
 *
 * @param onMountAction
 * @param onUnmountAction
 * @param awaitForCondition
 */
export const useOnMountAction = ({
  onMountAction,
  onUnmountAction,
  awaitForCondition = true,
}: UseOnMountActionParams): void => {
  const hasPerformedAction = useRef<boolean>(false);

  useEffect(() => {
    if (!hasPerformedAction.current && awaitForCondition) {
      hasPerformedAction.current = true;
      onMountAction();

      if (onUnmountAction) {
        return () => {
          onUnmountAction();
        };
      }
    }
  }, [awaitForCondition, hasPerformedAction, onMountAction, onUnmountAction]);
};
