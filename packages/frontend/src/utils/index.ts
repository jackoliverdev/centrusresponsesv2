import prettyBytes from "pretty-bytes";
import type { Options } from "pretty-bytes";
import { FolderWithThreadsSchema } from "common";

/**
 * Convert bytes to a human-readable string: 1337 → 1.34 kB.
 * @param {number} value
 * @param {Options} options
 */
export const formatBytes = (value: number, options?: Options) => {
  return prettyBytes(value, { space: false, ...options });
};

export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const isThreadInFolder = (
  threadId: string,
  folder?: FolderWithThreadsSchema,
) => {
  return folder?.threads.some((t) => t.id === threadId);
};
