import { AutoComplete, Checkbox } from "antd";
import { FunctionComponent, useCallback, useMemo, useState } from "react";
import { DataAccessTag } from "./DataAccessTag";
import { twMerge } from "tailwind-merge";
import { useTags } from "@/hooks/tags/useTags";
import { TagItemData } from "common";

export type MultipleTagsDropdownProps = {
  onSelect?: (tags: TagItemData[]) => void;
  onBlur?: () => void;
  existingTags?: TagItemData[];
  className?: string;
};

export const MultipleTagsDropdown: FunctionComponent<MultipleTagsDropdownProps> = ({
  onSelect,
  onBlur,
  existingTags = [],
  className,
}) => {
  const [search, setSearch] = useState("");
  const { data: allTags = [] } = useTags();
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());

  const availableTags = useMemo(
    () => allTags.filter((t) => !existingTags.some((et) => t.id === et.id)),
    [existingTags, allTags],
  );

  const filteredTags = useMemo(() => {
    return availableTags.filter((tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableTags, search]);

  const handleToggleTag = useCallback((tagId: number) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    const selectedTagObjects = availableTags.filter(tag => selectedTags.has(tag.id));
    if (selectedTagObjects.length > 0) {
      onSelect?.(selectedTagObjects);
    }
    setSelectedTags(new Set());
    onBlur?.();
  }, [availableTags, selectedTags, onSelect, onBlur]);

  return (
    <div className={twMerge("min-w-48 p-2 bg-white rounded-lg shadow-lg border border-gray-200", className)}>
      <input
        className="w-full px-2 py-1 mb-2 border rounded text-sm"
        placeholder="Search tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div className="max-h-48 overflow-y-auto">
        {filteredTags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleToggleTag(tag.id)}>
            <Checkbox checked={selectedTags.has(tag.id)} />
            <DataAccessTag tag={tag} />
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t flex justify-between gap-2">
        <button
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300"
          onClick={onBlur}
          type="button"
        >
          Cancel
        </button>
        <button
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleApply}
        >
          Apply ({selectedTags.size})
        </button>
      </div>
    </div>
  );
}; 