import React, { useMemo } from 'react';
import { PieChart, Pie, ResponsiveContainer, Legend, Cell } from 'recharts';
import { PRIMARY_COLOR, SECONDARY_COLOR } from '../../../../style.config';
import { add, partition } from 'lodash';
import { useDocuments } from '@/hooks/documents/useDocuments';
import { usePlan } from '@/hooks/plan/usePlan';

const COLORS = [PRIMARY_COLOR, SECONDARY_COLOR];

export const UsageChart = () => {
  const { data: documents = [] } = useDocuments();
  const { data: planData } = usePlan();

  const [uploadedUsage, IntegrationsUsage] = useMemo(
    () =>
      partition(
        documents,
        ({ drive_file_id, teams_document }) =>
          !drive_file_id && !teams_document,
      ).map((partitionedDocuments) =>
        partitionedDocuments.map(({ size }) => size).reduce(add, 0),
      ),
    [documents],
  );

  const data = useMemo(
    () => [
      { name: 'Uploaded', value: uploadedUsage },
      { name: 'Integrations', value: IntegrationsUsage },
    ],
    [uploadedUsage, IntegrationsUsage],
  );

  const totalUsage = useMemo(
    () => data.map(({ value }) => value).reduce(add, 0),
    [data],
  );

  const percentUsed = useMemo(
    () => planData?.storageLimit ? (totalUsage / planData.storageLimit) * 100 : 0,
    [planData, totalUsage],
  );

  return (
    // @ts-expect-error Responseive container expects a single child but PieChart has multiple children
    // I have to add multiple children to display the center label
    // Multiple childrens do not cause any issues
    <ResponsiveContainer width="100%" height="100%" className="relative">
      <PieChart width={400} height={400}>
        <Pie
          data={[{ value: 100 }]}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={90}
          fill="#f2f2f2"
          paddingAngle={0}
          isAnimationActive={false}
          legendType="none"
        />
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={90}
          startAngle={90}
          endAngle={(percentUsed / 100) * 360 + 90}
          fill="#82ca9d"
          legendType="circle"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

        <Legend
          iconSize={8}
          formatter={(value) => (
            <span className="text-neutral-600">{value}</span>
          )}
        />
      </PieChart>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-2xl font-bold">{Math.round(percentUsed)}%</div>
        <div className="text-neutral-600">used</div>
      </div>
    </ResponsiveContainer>
  );
};
