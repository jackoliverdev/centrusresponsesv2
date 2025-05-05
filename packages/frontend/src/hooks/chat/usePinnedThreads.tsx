import { useCallback, useMemo } from "react";
import { useQuery } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const usePinnedThreads = () => {
  const { data: pinnedThreads } = useQuery({
    queryFn: () => getAPI().post(API.getPinnedThreads),
    queryKey: ["pinned-threads"],
  });

  const orderMap: Record<string, number> = useMemo(
    () =>
      pinnedThreads?.reduce(
        (acc, curr) => ({ ...acc, [curr.threadId]: curr.order }),
        {},
      ) ?? {},
    [pinnedThreads],
  );

  // Check if a chat is pinned
  const isPinned = useCallback(
    (threadId: string) => {
      return pinnedThreads?.some((thread) => thread.threadId === threadId);
    },
    [pinnedThreads],
  );

  const isHighestPin = useCallback(
    (threadId: string) => {
      return Math.min(...Object.values(orderMap)) === orderMap[threadId];
    },
    [orderMap],
  );

  const isLowestPin = useCallback(
    (threadId: string) => {
      return Math.max(...Object.values(orderMap)) === orderMap[threadId];
    },
    [orderMap],
  );

  return {
    pinnedThreads,
    isPinned,
    isHighestPin,
    isLowestPin,
    orderMap,
  };
};
