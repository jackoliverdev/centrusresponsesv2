import { getAPI } from "@/utils/api";
import { API } from "common";
import { useQuery } from "react-query";

export const getOrganizationsQueryKey = (params: { limit?: number }) => ["recent-organizations", params];

export const useRecentOrganizations = ({ limit }: { limit?: number }) => {
  return useQuery({
    queryKey: getOrganizationsQueryKey({ limit }),
    queryFn: async () => {
      return await getAPI().post(API.getOrganizations, {
        limit,
        orderBy: "created_at",
        order: "desc",
      });
    },
  });
};
