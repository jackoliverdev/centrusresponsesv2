import { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import type { FunctionComponent, MouseEvent, KeyboardEvent } from "react";
import { Input, InputRef } from "antd";

type Props = {
  text: string;
  isLoading: boolean;
  onEdit: (newName: string) => void;
  onChangeMode?: (newName: "input" | "text") => void;
  classNames?: { input?: string; text?: string };
};

export const EditableDiv: FunctionComponent<Props> = ({
  text,
  onEdit,
  isLoading,
  classNames,
  onChangeMode,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const inputRef = useRef<InputRef>(null);

  const handleDoubleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditedText(text);
    },
    [text],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsEditing(false);
        setEditedText(text);
      }
    },
    [text],
  );

  const handleSave = useCallback(() => {
    if (editedText.trim() !== "" && editedText !== text) {
      onEdit(editedText);
    }
    setIsEditing(false);
  }, [editedText, onEdit, text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus({
        cursor: "all",
      });
    }

    onChangeMode?.(isEditing ? "input" : "text");
  }, [isEditing, onChangeMode]);

  return isEditing ? (
    <div
      className={twMerge(
        "w-full relative flex items-center",
        classNames?.input,
      )}
      draggable={false}
    >
      <Input
        ref={inputRef}
        size="small"
        className={classNames?.input}
        defaultValue={editedText}
        allowClear
        autoFocus
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setEditedText(e.target.value.trim())}
        onPressEnter={handleSave}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
      />
    </div>
  ) : (
    <div
      onDoubleClick={handleDoubleClick}
      onClick={(e) => e.stopPropagation()}
      className={twMerge(
        "cursor-text inline max-w-full hover:bg-gray-100/50 rounded px-0.5 -mx-0.5",
        classNames?.text
      )}
      title="Double click to rename"
    >
      {isLoading ? editedText : text}
    </div>
  );
};
