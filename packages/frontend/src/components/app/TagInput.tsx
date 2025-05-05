import { PlusOutlined } from "@ant-design/icons";
import { Tag, Tooltip } from "antd";
import { FunctionComponent, useCallback, useState } from "react";
import { DataAccessTag } from "./DataAccessTag";
import { Loader } from "../ui/loader";
import { TagDropdown } from "./TagDropdown";
import { twMerge } from 'tailwind-merge';
import { TagItemData } from 'common';

export type TagInputProps = {
  onSubmit?: (tag: TagItemData) => void;
  existingTag?: TagItemData;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  buttonClass?: string;
  inputClass?: string;
};

export const TagInput: FunctionComponent<TagInputProps> = ({
  onSubmit,
  existingTag,
  loading,
  disabled,
  buttonClass,
  inputClass,
  placeholder = "Assign Tag",
}) => {
  const [inputVisible, setInputVisible] = useState(false);

  const showInput = useCallback(() => {
    setInputVisible(true);
  }, []);

  const handleInputConfirm = useCallback(
    (value: TagItemData) => {
      setInputVisible(false);
      if (value) onSubmit?.(value);
    },
    [onSubmit],
  );

  const reset = useCallback(() => {
    setInputVisible(false);
  }, []);

  return (
    <>
      {inputVisible ? (
        <TagDropdown
          onSelect={handleInputConfirm}
          onBlur={reset}
          existingTags={existingTag ? [existingTag] : []}
          className={inputClass}
        />
      ) : (
        <button
          className="disabled:opacity-50 flex items-center"
          onClick={showInput}
          disabled={loading || disabled}
        >
          {existingTag ? (
            <Tooltip placement="top" title="Replace Tag" arrow>
              <DataAccessTag className="shadow hover:shadow-lg hover:brightness-90" tag={existingTag} />
            </Tooltip>
          ) : (
            <Tag
              className={twMerge("flex items-center border-dashed py-0.5", buttonClass)}
              icon={<PlusOutlined />}
            >
              {placeholder}
            </Tag>
          )}
          {loading && <Loader className="size-4" />}
        </button>
      )}
    </>
  );
};
