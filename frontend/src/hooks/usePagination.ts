import { useMemo, useState } from "react";

export interface Pagination<T> {
    page: number;
    pageSize: number;
    pageCount: number;
    pageItems: T[];
    total: number;
    rangeStart: number;
    rangeEnd: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    /** True when there are more rows than the smallest page size. */
    hasControls: boolean;
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** Client-side pagination over an in-memory array. */
export function usePagination<T>(
    items: T[],
    initialSize: number = PAGE_SIZE_OPTIONS[2],
): Pagination<T> {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSizeRaw] = useState(initialSize);

    const total = items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, safePage, pageSize]);

    const setPageSize = (size: number) => {
        setPageSizeRaw(size);
        setPage(1);
    };

    const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeEnd = Math.min(safePage * pageSize, total);

    return {
        page: safePage,
        pageSize,
        pageCount,
        pageItems,
        total,
        rangeStart,
        rangeEnd,
        setPage: (p: number) => setPage(Math.min(Math.max(1, p), pageCount)),
        setPageSize,
        hasControls: total > PAGE_SIZE_OPTIONS[0],
    };
}
