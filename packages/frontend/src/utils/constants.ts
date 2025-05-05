export const REGEX = {
  /**
   * Matches a UUID.
   *
   * Example:
   * 123e4567-e89b-12d3-a456-426614174000
   */
  uuid: /\b[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}\b/,

  positiveInt: /^[1-9]\d*$/,
};

export const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', className: 'text-red-600 bg-red-50' },
  { value: 'high', label: 'High', className: 'text-orange-600 bg-orange-50' },
  { value: 'medium', label: 'Medium', className: 'text-yellow-600 bg-yellow-50' },
  { value: 'low', label: 'Low', className: 'text-green-600 bg-green-50' },
]