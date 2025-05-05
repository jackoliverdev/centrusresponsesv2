import { useCallback, useMemo, useState } from 'react';
import { scaffoldContext } from '@/context/scaffoldContext';
import {
  API,
  OrganizationMemberSchema,
  OrganizationSchema,
  UserWithOrganizationSchema,
} from 'common';
import { useAuthContext } from '@/context/AuthContext';
import { useOnStateChange } from '@/hooks/useOnStateChange';
import { getAPI } from '@/utils/api';
import { useQueryClient } from 'react-query';

const useOrganizationContextValue = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [isLoadingOrganization, setIsLoadingOrganization] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState<
    UserWithOrganizationSchema['organizations'][0] | null
  >(null);

  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [members, setMembers] = useState<OrganizationMemberSchema[]>([]);

  const changeCurrentOrganization = useCallback(
    (organizationId?: OrganizationSchema['id'] | null) => {
      const organization = user?.organizations.find(
        (o) => o.id === organizationId,
      );
      setCurrentOrganization(organization ?? null);
    },
    [user],
  );

  /**
   * When logging in, set the current organization to the
   * first organization the user is a member of.
   */
  useOnStateChange(
    user,
    useCallback((newUser) => {
      setIsLoadingOrganization(true);
      if (newUser?.organizations?.length && newUser.activeOrganizationId) {
        changeCurrentOrganization(newUser.activeOrganizationId)
      }

      setIsLoadingOrganization(false);
    }, [changeCurrentOrganization]),
  );

  /**
   * When logging in, set the current organization to the
   * first organization the user is a member of.
   */
  useOnStateChange(
    currentOrganization,
    useCallback(
      async (newOrganization) => {
        setIsLoadingMembers(true);

        if (newOrganization) {
          const [fetchedMembers] = await Promise.all([
            getAPI({
              organizationId: newOrganization.id,
            }).post(API.getOrganizationMembers),
            queryClient.invalidateQueries(["active-plan"]),
          ]);
          if (fetchedMembers) {
            setMembers(fetchedMembers);
          }
        }

        setIsLoadingMembers(false);
      },
      [queryClient],
    ),
  );

  return useMemo(
    () => ({
      isLoading: isLoadingOrganization || isLoadingMembers,
      currentOrganization,
      changeCurrentOrganization,
      members,
    }),
    [
      isLoadingOrganization,
      isLoadingMembers,
      currentOrganization,
      changeCurrentOrganization,
      members,
    ],
  );
};

const [OrganizationContextProvider, useOrganizationContext] = scaffoldContext(
  useOrganizationContextValue,
);
export { OrganizationContextProvider, useOrganizationContext };
