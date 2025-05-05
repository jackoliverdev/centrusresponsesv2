import { useMutation, useQueryClient } from "react-query";
import { API } from "common";
import { getAPI } from "@/utils/api";

export const useUpdateSuggestedTagContext = () => {
  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation({
    mutationFn: async (suggested_tag_context: string) => {
      await getAPI().post(API.updateSuggestedTagContext, {
        suggested_tag_context,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['organization']);
    },
  });

  return {
    updateSuggestedTagContext: mutate,
    isLoading,
  };
}; 