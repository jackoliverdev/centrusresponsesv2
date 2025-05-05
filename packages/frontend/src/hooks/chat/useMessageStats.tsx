import { getAPI } from '@/utils/api';
import { API } from 'common';
import { format } from 'date-fns';
import { useQuery } from 'react-query';

export const useMessageStats = ({ start, end }: { start: Date; end: Date }) => {
  return useQuery(
    [
      'chatStats',
      { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') },
    ],
    async () => {
      return await getAPI().post(API.getMessageStats, {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      });
    },
  );
};
