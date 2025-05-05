import { useQuery } from "react-query";
import { getAPI } from "@/utils/api";
import { API } from "common";

export const useOrganizationMembers = () => {
  return useQuery({
    queryKey: ["organizationMembers"],
    queryFn: async () => {
      return getAPI().post(API.getOrganizationMembers);
    },
  });
}; 