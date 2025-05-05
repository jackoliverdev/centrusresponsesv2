import { useQuery } from 'react-query';
import { getAPI } from '@/utils/api';
import { API } from 'common';

export const getSuggestedTagsQueryKey = (documentId: string) => 
  ['suggestedTags', documentId];

export const useSuggestedTags = (documentId: string, organizationId: number) => {
  return useQuery(
    getSuggestedTagsQueryKey(documentId),
    async () => {
      if (!documentId) return [];
      return getAPI().post(API.getSuggestedTags, { documentId, organizationId });
    },
    {
      enabled: !!documentId && !!organizationId,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    }
  );
}; 