import { FormattedStat, UsageStat } from './schema';

/**
 * formats number with the given options
 * @param {number | bigint | string} value
 * @param {Intl.NumberFormatOptions} options
 * @returns {string}
 */
export const formatNumber = (
  value?: number | bigint | string,
  options?: Intl.NumberFormatOptions,
): string => {
  let newValue = !value ? 0 : value;
  if (typeof newValue === 'string') {
    newValue = Number(value);
  }

  return new Intl.NumberFormat('en-US', options).format(newValue);
};

/**
 * formats number with the given options
 * @param {number | bigint | string} value
 * @param {Intl.NumberFormatOptions} options
 * @returns {string}
 */
export const formatCurrency = (
  value?: number | bigint | string,
  options?: Intl.NumberFormatOptions,
): string => {
  return formatNumber(value, {
    ...options,
    style: 'currency',
    currency: 'GBP',
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * formats number with the given options
 * @param {number | bigint | string} value
 * @param {Intl.NumberFormatOptions} options
 * @returns {string}
 */
export const formatPercent = (
  value?: number | bigint | string,
  options?: Intl.NumberFormatOptions,
): string => {
  return formatNumber(value, {
    ...options,
    style: 'percent',
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * computes the plan statistics, with formatting for easy rendering
 * @param usageLimits
 * @param usages
 */
export const formatPlanStats = ({
  usageLimits,
  usages,
}: {
  usageLimits?: UsageStat;
  usages?: UsageStat;
}): FormattedStat => {
  const storageLimit = usageLimits?.storage ?? 0;
  const storageUsage = usages?.storage ?? 0;
  const storagePercentage = (storageUsage / (storageLimit || 1)) * 100;

  const messageLimit = usageLimits?.messages ?? 0;
  const messageUsage = usages?.messages ?? 0;
  const messagePercentage = (messageUsage / (messageLimit || 1)) * 100;

  const userLimit = usageLimits?.users ?? 0;
  const userUsage = usages?.users ?? 0;
  const userPercentage = (userUsage / (userLimit || 1)) * 100;

  return {
    storageLimit,
    storageUsage,
    storagePercentage,
    messageLimit: formatNumber(messageLimit, {
      useGrouping: true,
      maximumFractionDigits: 0,
    }),
    messageUsage: formatNumber(messageUsage, {
      useGrouping: true,
      maximumFractionDigits: 0,
    }),
    messagePercentage,
    userLimit: formatNumber(userLimit, {
      useGrouping: true,
      maximumFractionDigits: 0,
    }),
    userUsage: formatNumber(userUsage, {
      useGrouping: true,
      maximumFractionDigits: 0,
    }),
    userPercentage,
  };
};
