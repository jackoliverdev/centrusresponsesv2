import { Select } from 'antd';
import { FunctionComponent } from 'react';

export type SortDropdownProps = {
  options: Array<{
    name: string;
    key: string;
  }>;
  value: string;
  onChange: (value: string) => void;
};

export const SortDropdown: FunctionComponent<SortDropdownProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <div>
      <span className="text-neutral-500">Sort by: </span>
      <Select
        options={options.map(({ key, name }) => ({ label: name, value: key }))}
        value={value}
        onChange={onChange}
        variant="borderless"
        className="w-28"
      />
    </div>
  );
};
