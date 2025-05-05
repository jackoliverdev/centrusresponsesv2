import { useCallback, useMemo, useState } from "react";
import { TablePaginationConfig } from "antd/lib";
import { FilterValue, SearchFilter } from "common";
import { SorterResult } from "antd/lib/table/interface";

export const usePaginate = (options?: {
  defaultOrder: {
    orderBy?: string;
    order?: "asc" | "desc";
  };
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterBy, setFilterBy] = useState<SearchFilter[]>([]);
  const [orderBy, setOrderBy] = useState(options?.defaultOrder ?? {});

  const onTableChange = useCallback(
    (
      pagination: TablePaginationConfig,
      filters: Record<string, FilterValue[] | null>,
      sorter: SorterResult | SorterResult[],
      { action }: { action: "paginate" | "filter" | "sort" },
    ) => {
      if (pagination.current && pagination.current !== page) {
        setPage(pagination.current);
      }
      if (pagination.pageSize && pagination.pageSize !== limit) {
        setLimit(pagination.pageSize);
      }

      if (action === "filter") {
        const savedFilters = Object.keys(filters);
        if (savedFilters.length > 0) {
          const newFilters: SearchFilter[] = [];

          savedFilters.forEach((key) => {
            const filterValue = filters[key]?.at(0);
            if (filterValue !== undefined) {
              newFilters.push({
                key,
                value: filterValue,
                operator: "eq",
              });
            }
          });
          setFilterBy(newFilters);
        } else {
          setFilterBy([]);
        }
      } else if (action === "sort") {
        const singleSort = Array.isArray(sorter) ? sorter[0] : sorter;

        if (singleSort.order && typeof singleSort.field === "string") {
          setOrderBy({
            orderBy: singleSort.field,
            order: singleSort.order === "descend" ? "desc" : "asc",
          });
        } else {
          setOrderBy({});
        }
      }
    },
    [page, limit],
  );

  return useMemo(
    () => ({
      page,
      limit,
      filterBy,
      orderBy,
      onTableChange,
    }),
    [limit, page, filterBy, orderBy, onTableChange],
  );
};
