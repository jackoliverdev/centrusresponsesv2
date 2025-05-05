import { getAPI } from "@/utils/api";
import { API, PaginateTagsParams } from "common";
import { useQuery } from "react-query";

export const getTagsInfoQueryKey = (params: PaginateTagsParams) => ["tags-info", params];

export const useTagsInfo = (filters: PaginateTagsParams) => {
  return useQuery({
    queryKey: getTagsInfoQueryKey(filters),
    queryFn: async () => {
      return getAPI().post(API.getTagsWithInfo, filters);
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};
