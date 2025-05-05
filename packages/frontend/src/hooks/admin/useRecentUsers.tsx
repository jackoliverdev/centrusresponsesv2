import { getAPI } from "@/utils/api";
import { API } from "common";
import { useQuery } from "react-query";

export const getRecentUsersQueryKey = (params: { limit?: number }) => ["recent-users", params];

export const useRecentUsers = ({ limit }: { limit?: number }) => {
  return useQuery({
    queryKey: getRecentUsersQueryKey({ limit }),
    queryFn: async () => {
      return await getAPI().post(API.getUsers, {
        limit,
        orderBy: "created_at",
        order: "desc",
      });
    },
  });
};
