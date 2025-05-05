import { FunctionComponent, HTMLAttributes, useCallback } from "react";
import { Input } from "antd";
import classNames from "classnames";

type Props = {
  searchText: string;
  onSetSearchText: (text: string) => void;
  onSearch?: () => void;
  loading?: boolean;
  placeholder?: string;
} & HTMLAttributes<HTMLDivElement>;

const SearchFilter: FunctionComponent<Props> = ({
  className,
  searchText,
  loading = false,
  placeholder = "",
  onSetSearchText,
  onSearch,
  ...props
}) => {
  const handleSearch = useCallback(() => {
    if (searchText) {
      onSearch?.();
    }
  }, [onSearch, searchText]);

  return (
    <div
      className={classNames(
        "flex w-full items-center gap-x-4 max-w-xl",
        className,
      )}
      {...props}
    >
      <Input.Search
        size="large"
        placeholder={placeholder}
        onChange={(ev) => onSetSearchText(ev.target.value)}
        loading={loading && searchText.length > 0}
        onSearch={onSearch ? handleSearch : undefined}
        allowClear
      />
    </div>
  );
};
SearchFilter.displayName = "SearchFilter";

export { SearchFilter };
