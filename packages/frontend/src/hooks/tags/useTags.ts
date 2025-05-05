import { getAPI } from "@/utils/api";
import { API } from "common";
import { useQuery } from "react-query";

export const getTagsQueryKey = ["tags"];

export const useTags = () => {
  return useQuery({
    queryKey: getTagsQueryKey,
    queryFn: async () => {
      return getAPI().post(API.getTags);
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};
