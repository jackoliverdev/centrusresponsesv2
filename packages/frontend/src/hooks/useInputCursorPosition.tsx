import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export const useInputCursorPosition = <
  T extends HTMLTextAreaElement & {
    resizableTextArea?: { textArea: HTMLTextAreaElement };
  },
>({
  textareaRef,
}: {
  textareaRef: MutableRefObject<T | null>;
}) => {
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const handleCursorChange = useCallback((field: T) => {
    if (field) {
      setSelectionStart(field.selectionStart);
      setSelectionEnd(field.selectionEnd);
    }
  }, []);

  useEffect(() => {
    const field = textareaRef.current?.resizableTextArea?.textArea;

    if (field) {
      field.onselectionchange = (ev) => {
        handleCursorChange(ev.target as T);
      };
    }

    return () => {
      if (field) {
        field.onselectionchange = null
      }
    }
  }, [handleCursorChange, textareaRef]);

  return useMemo(
    () => ({
      selectionStart: selectionStart ?? -1,
      selectionEnd: selectionEnd ?? -1,
    }),
    [selectionStart, selectionEnd],
  );
};
