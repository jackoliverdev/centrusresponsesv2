import { useQuery } from "react-query";
import { getAPI } from "@/utils/api";
import { API, TagInfoSchema } from "common";

export const getTagInfoQueryKey = (tagId: number) => ["tag-info", tagId];

export const useTagInfo = (tagId?: number) => {
  return useQuery({
    queryKey: tagId ? getTagInfoQueryKey(tagId) : ["tag-info"],
    queryFn: async () => {
      if (!tagId) return null;
      // Use getTagsWithInfo with a filter for the specific tag
      const result = await getAPI().post(API.getTagsWithInfo, {
        filters: [{ key: "id", operator: "eq", value: tagId }],
        limit: 1,
        page: 1,
      });
      return result?.data?.[0] || null;
    },
    enabled: !!tagId,
  });
}; 