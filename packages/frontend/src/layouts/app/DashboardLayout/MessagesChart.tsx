import React, { useCallback, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SECONDARY_COLOR } from '../../../../style.config';
import { useMessageStats } from '@/hooks/chat/useMessageStats';
import { format, subWeeks } from 'date-fns';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

export const MessagesChart = () => {
  const [range, setRange] = useState<[Date, Date]>([subWeeks(new Date(), 1), new Date()]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: stats = [], isLoading } = useMessageStats({
    start: range[0],
    end: range[1],
  });

  const CustomTooltip = useCallback(
    ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: { value: number; label: string }[];
      label?: string;
    }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-black text-white rounded-lg text-sm space-y-1.5 py-3 px-4">
            <div className="font-bold">{label && format(label, 'MMM dd')}</div>
            <div className="flex gap-4">
              <div>Messages</div>
              <div className="font-bold">{payload[0].value}</div>
            </div>
          </div>
        );
      }

      return null;
    },
    [],
  );

  return (
    <>
      <div className="flex justify-center md:justify-between">
        <div className="text-xl font-bold mb-4 hidden md:block">Messages</div>
        <div>
          <div className="md:hidden">
            {showDatePicker ? (
              <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
                <div className="flex justify-between gap-8">
                  <div>
                    <div className="text-gray-500 text-lg mb-3">Start date</div>
                    <input
                      type="date"
                      value={format(range[0], 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        setRange([newDate, range[1]]);
                      }}
                      className="rounded-lg bg-gray-100 p-3 border-0 text-lg"
                    />
                  </div>
                  <div>
                    <div className="text-gray-500 text-lg mb-3">End date</div>
                    <input
                      type="date"
                      value={format(range[1], 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        setRange([range[0], newDate]);
                      }}
                      className="rounded-lg bg-gray-100 p-3 border-0 text-lg"
                    />
                  </div>
                </div>
                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    onClick={() => setShowDatePicker(false)}
                    className="w-32 h-11 text-base bg-[#00205B] hover:bg-[#00205B]/90"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setShowDatePicker(true)}
                className="flex items-center gap-2 text-[#00205B] border border-[#00205B]/20 rounded-full px-4 py-2"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>{format(range[0], 'dd MMM')} - {format(range[1], 'dd MMM')}</span>
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <DatePicker.RangePicker
              value={[dayjs(range[0]), dayjs(range[1])]}
              onChange={(value) => {
                if (!value || !value[0] || !value[1]) return;
                setRange([value[0].toDate(), value[1].toDate()]);
              }}
              format={'DD MMM YYYY'}
              allowClear={false}
            />
          </div>
        </div>
      </div>
      {isLoading ? (
        <Loader className="mx-auto mt-24" />
      ) : stats.length === 0 ? (
        <div className="text-center text-2xl font-semibold text-neutral-400 mt-24">
          No Data Available
        </div>
      ) : (
        <div className="h-[310px] md:h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              width={500}
              height={400}
              data={stats}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                strokeOpacity={0.25}
                tickFormatter={(v) => format(v, 'dd MMM')}
              />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={SECONDARY_COLOR}
                fill="url(#colorUv)"
              />
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={SECONDARY_COLOR}
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="95%"
                    stopColor={SECONDARY_COLOR}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
};
