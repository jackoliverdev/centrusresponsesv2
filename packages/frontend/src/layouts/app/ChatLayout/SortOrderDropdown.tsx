import { Select } from 'antd';
import { FunctionComponent } from 'react';

export type SortOrderDropdownProps = {
  ascending: boolean;
  labels: {
    ascending: string;
    descending: string;
  };
  onChange: (value: boolean) => void;
};

export const SortOrderDropdown: FunctionComponent<SortOrderDropdownProps> = ({
  ascending,
  labels,
  onChange,
}) => {
  const value = ascending ? 'Ascending' : 'Descending';
  return (
    <Select
      options={[
        {
          label: labels.ascending,
          value: 'Ascending',
        },
        {
          label: labels.descending,
          value: 'Descending',
        },
      ]}
      value={value}
      onChange={(v) => onChange(v == 'Ascending')}
      variant="borderless"
      className="w-32"
    />
  );
};
