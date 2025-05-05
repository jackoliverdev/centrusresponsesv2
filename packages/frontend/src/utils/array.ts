/**
 * Returns an array with the elements that only
 * appear in arr1
 */
export function getDifference<ItemType = any>(
  arr1: ItemType[],
  arr2: ItemType[],
): ItemType[] {
  return arr1.filter((item) => !arr2.includes(item));
}

/**
 * Returns a copy of arr, with new item inserted after
 * insertAfter.
 */
export const insertAfter = (
  arr: string[],
  newItem: string,
  insertAfterItem?: string,
): string[] => {
  const index = insertAfterItem ? arr.indexOf(insertAfterItem) : -1;
  // insertAfter not found in array
  if (index === -1) {
    return [...arr, newItem];
  }

  return [...arr.slice(0, index + 1), newItem, ...arr.slice(index + 1)];
};
