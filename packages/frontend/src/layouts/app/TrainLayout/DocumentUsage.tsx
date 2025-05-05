import { HardDrive } from 'lucide-react';
import React, { FunctionComponent } from 'react';
import { Progress } from 'antd';
import { formatBytes } from '@/utils';
import { usePlan } from '@/hooks/plan/usePlan';

export type DocumentUsageProps = object;

export const DocumentUsage: FunctionComponent<DocumentUsageProps> = () => {
  const { data: planData } = usePlan();

  return (
    <div className="bg-white rounded-lg shadow-sm py-8 px-6 flex lg:items-center justify-between gap-2 lg:gap-4 border flex-col lg:flex-row">
      <div className="flex lg:items-center gap-4 flex-col lg:flex-row">
        <div className="flex items-center space-x-2 w-64">
          <div className="size-6 flex items-center justify-center rounded bg-gray-600">
            <HardDrive className="size-4 text-gray-100" />
          </div>
          <span className="font-medium text-gray-700">Sources</span>
        </div>
        <div className="text-sm text-gray-500 text-nowrap">
          {formatBytes(planData?.storageUsage ?? 0)} / {formatBytes(planData?.storageLimit ?? 1)} limit
        </div>
      </div>
      <Progress
        size="small"
        percent={parseFloat((planData?.storagePercentage ?? 0).toFixed(2))}
        showInfo
        status={
          (planData?.storagePercentage ?? 0) >= 90
            ? "exception"
            : "normal"
        }
      />
    </div>
  );
};
