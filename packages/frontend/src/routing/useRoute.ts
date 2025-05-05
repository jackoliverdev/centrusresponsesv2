import { RouteHelper } from "@/routing/routes";
import { useCallback } from "react";
import { useRouter } from "next/router";
import { useOnMountAction } from "@/hooks/useOnMountAction";

type UseRouteParams = {
  /**
   * Redirect to the specified path, when
   * `onCondition` is true.
   *
   * Redirects to the first available route.
   */
  redirect?: {
    onCondition?: boolean;
    toDefaultAuthenticatedPath?: boolean;
    toDefaultPublicPath?: boolean;
    toPath?: string;
    params?: Record<string, any>;
  };
};

/**
 * Handles route actions, and redirects, using a RouteHelper
 */
export function useRoute<T extends string>(
  routeHelper: RouteHelper<T>,
  { redirect }: UseRouteParams,
) {
  const router = useRouter();

  useOnMountAction({
    onMountAction: useCallback(async () => {
      let targetPath = redirect?.toPath;

      if (redirect?.toDefaultAuthenticatedPath) {
        targetPath = routeHelper.getDefaultPath(redirect?.params ?? {}, true);
      }
      if (redirect?.toDefaultPublicPath) {
        targetPath = routeHelper.getDefaultPath(redirect?.params ?? {}, false);
      }

      if (!targetPath) {
        console.warn(`useRoute called without targetPath`);
        return;
      }

      await router.push(targetPath);
    }, [redirect, routeHelper, router]),
    awaitForCondition: redirect?.onCondition,
  });
}
