import { getAPI } from "@/utils/api";
import { useOrganizationContext } from "@/context/OrganizationContext";
import { useMemo } from "react";

export const useAPIWithOrganization = () => {
  const { currentOrganization } = useOrganizationContext();

  return useMemo(
    () => ({
      apiWithOrganization: getAPI({ organizationId: currentOrganization?.id }),
    }),
    [currentOrganization?.id],
  );
};
