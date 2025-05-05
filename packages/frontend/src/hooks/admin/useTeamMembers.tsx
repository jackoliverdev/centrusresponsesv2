import { useMemo } from 'react';
import { useOrganizationUsers } from './useOrganizationUsers';

export const useTeamMembers = (id: number) => {
  const query = useOrganizationUsers();

  const data = useMemo(() => {
    return query.data?.filter((u) => u.teamlead_id === id);
  }, [query.data, id]);

  return { ...query, data };
};
