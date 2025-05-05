import { useMutation, useQueryClient } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

type AssignUserToTagParams = {
  userId: number;
  tagId: number;
  action: 'assign' | 'unassign';
};

export const useAssignUserToTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AssignUserToTagParams) => {
      return getAPI().post(API.assignUserToTag, params);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(["tags-info"]);
      queryClient.invalidateQueries(["organizationMembers"]);
    },
  });
}; 