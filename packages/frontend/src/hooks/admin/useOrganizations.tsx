import { getAPI } from "@/utils/api";
import { API, PaginateOrganizationsParams } from "common";
import { useQuery } from "react-query";

export const getOrganizationsQueryKey = (
  params: PaginateOrganizationsParams,
) => ["organizations", params];

export const useOrganizations = (filters: PaginateOrganizationsParams) => {
  return useQuery({
    queryKey: getOrganizationsQueryKey(filters),
    queryFn: async () => {
      return await getAPI().post(API.getOrganizations, filters);
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};
