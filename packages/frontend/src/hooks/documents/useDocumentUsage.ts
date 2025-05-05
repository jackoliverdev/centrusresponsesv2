import { useDocuments } from './useDocuments';

export const getDocumentUsageQueryKey = () => ['document-usage'];

export const useDocumentUsage = () => {
  const query = useDocuments();
  const data = query.data?.reduce((prev, { size }) => prev + size, 0);
  return { ...query, data };
};
