import { getAPI } from "@/utils/api";
import { API, PaginateUsersParams } from "common";
import { useQuery } from "react-query";

export const getUsersQueryKey = (params: PaginateUsersParams) => [
  "users",
  params,
];

export const useUsers = (filters: PaginateUsersParams) => {
  return useQuery({
    queryKey: getUsersQueryKey(filters),
    queryFn: async () => {
      return await getAPI().post(API.getUsers, filters);
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};
