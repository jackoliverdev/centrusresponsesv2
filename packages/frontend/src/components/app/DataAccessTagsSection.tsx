import { FunctionComponent, useCallback, useState } from "react";
import { DataAccessTag } from "./DataAccessTag";
import { Tag, Popover } from "antd";
import { TagDropdown } from "./TagDropdown";
import { TagItemData } from "common";
import { useTags } from "@/hooks/tags/useTags";
import { MultipleTagsDropdown } from "./MultipleTagsDropdown";

export type DataAccessTagsSectionProps = {
  value: TagItemData[];
  onChange?: (v: TagItemData[]) => void;
  loading?: boolean;
  readOnly?: boolean;
};

export const DataAccessTagsSection: FunctionComponent<
  DataAccessTagsSectionProps
> = ({ value = [], onChange, readOnly }) => {
  const [adding, setAdding] = useState(false);
  const [addingMultiple, setAddingMultiple] = useState(false);
  const { data: allTags = [] } = useTags();

  const handleAdd = useCallback(
    (tag: TagItemData) => {
      setAdding(false);
      if (!value.some((t) => t.id === tag.id)) {
        onChange?.([...value, tag]);
      }
    },
    [onChange, value],
  );

  const handleAddMultiple = useCallback(
    (tags: TagItemData[]) => {
      setAddingMultiple(false);
      const newTags = tags.filter(tag => !value.some(v => v.id === tag.id));
      if (newTags.length > 0) {
        onChange?.([...value, ...newTags]);
      }
    },
    [onChange, value],
  );

  const handleAddAll = useCallback(() => {
    const newTags = allTags.filter(tag => !value.some(v => v.id === tag.id));
    if (newTags.length > 0) {
      onChange?.([...value, ...newTags]);
    }
  }, [allTags, value, onChange]);

  return (
    <div>
      <h4 className="text-base font-bold mb-2">Data access tag</h4>
      <div className="mb-6 flex gap-x-1 gap-y-2 flex-wrap">
        {value.map((tag, i) => (
          <DataAccessTag
            onClose={() => onChange?.(value.filter((t) => t.id !== tag.id))}
            closable={!readOnly}
            key={i}
            tag={tag}
          />
        ))}
        {readOnly && value.length == 0 && <span>No tags</span>}
        {!readOnly && (
          <>
            {adding ? (
              <TagDropdown onSelect={handleAdd} onBlur={() => setAdding(false)} existingTags={value} />
            ) : addingMultiple ? (
              <MultipleTagsDropdown 
                onSelect={handleAddMultiple} 
                existingTags={value} 
                onBlur={() => setAddingMultiple(false)}
              />
            ) : (
              <>
                <Tag
                  className="flex items-center cursor-pointer"
                  onClick={() => setAdding(true)}
                >
                  Add Tag
                </Tag>
                <Popover
                  content={<MultipleTagsDropdown 
                    onSelect={handleAddMultiple} 
                    existingTags={value} 
                    onBlur={() => setAddingMultiple(false)}
                  />}
                  trigger="click"
                  open={addingMultiple}
                  onOpenChange={setAddingMultiple}
                >
                  <Tag
                    className="flex items-center cursor-pointer"
                  >
                    Add Multiple Tags
                  </Tag>
                </Popover>
                <Tag
                  className="flex items-center cursor-pointer"
                  onClick={handleAddAll}
                >
                  Add All Tags
                </Tag>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
