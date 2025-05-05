import { AutoComplete } from "antd";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { DataAccessTag } from "./DataAccessTag";
import { twMerge } from "tailwind-merge";
import { useTags } from "@/hooks/tags/useTags";
import { DEFAULT_TAG_COLORS, TagItemData } from "common";

export type TagDropdownProps = {
  onSelect?: (tag: TagItemData) => void;
  onBlur?: () => void;
  existingTags?: TagItemData[];
  className?: string;
};

export const TagDropdown: FunctionComponent<TagDropdownProps> = ({
  onSelect,
  onBlur,
  existingTags = [],
  className,
}) => {
  const [search, setSearch] = useState("");
  const { data: allTags = [] } = useTags();

  const availableTags = useMemo(
    () => allTags.filter((t) => !existingTags.some((et) => t.id === et.id)),
    [existingTags, allTags],
  );

  const options = useMemo(() => {
    const tags = availableTags.filter((tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()),
    );

    const searchedTagExists =
      availableTags.map((tag) => tag.name).includes(search) || search === "";
    if (searchedTagExists) return tags;
    const color = DEFAULT_TAG_COLORS[Math.floor(Math.random() * 10)];

    const tag = {
      id: Math.min(...existingTags.map((t) => t.id), 0) - 1,
      name: search,
      backgroundColor: color.backgroundColor,
      textColor: color.textColor,
    };
    return [...tags, tag];
  }, [availableTags, existingTags, search]);

  const onSelectItem = useCallback(
    (opt?: TagItemData) => {
      if (opt) {
        onSelect?.(opt);
      }
    },
    [onSelect],
  );

  return (
    <AutoComplete
      size="small"
      className={twMerge("w-24", className)}
      onSelect={(_, opt) => onSelectItem(opt)}
      options={options}
      onSearch={setSearch}
      onBlur={onBlur}
      dropdownStyle={{ width: "15rem" }}
      fieldNames={{ label: "name", value: "id" }}
      autoFocus
      defaultOpen
      filterOption={(inputValue, option) =>
        option?.name?.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
      }
      optionRender={(opt) =>
        Number(opt.value) <= 0 ? (
          <div className="flex gap-2 items-center">
            Create
            <DataAccessTag tag={opt.data} />
          </div>
        ) : (
          <DataAccessTag tag={opt.data} />
        )
      }
    />
  );
};
