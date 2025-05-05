import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { SearchFilter } from "common";

export const useSearch = ({
  searchFilters,
}: {
  searchFilters: (Omit<SearchFilter, "value"> & { isNumeric?: boolean })[];
}) => {
  const [query, setQuery] = useState("");

  // Create debounced search handler
  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => {
        setQuery(value.trim());
      }, 800), // 500ms delay
    [],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  return useMemo(() => {
    const value = query.trim();

    const queryFilters = !value
      ? []
      : searchFilters
          .filter((filter) => {
            return !filter.isNumeric || !Number.isNaN(Number(value));
          })
          .map(({ key, operator }) => {
            return { key, operator, value };
          });

    return {
      query: value,
      setQueryQuery: debouncedSetQuery,
      queryFilters,
    };
  }, [query, searchFilters, debouncedSetQuery]);
};
