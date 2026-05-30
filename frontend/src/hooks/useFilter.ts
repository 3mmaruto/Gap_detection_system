import { useCallback, useState } from "react";

/**
 * Single-select filter state with a sentinel "all" value.
 * Used to drive <FilterBar> and the query passed to data hooks.
 */
export const ALL = "__all__" as const;
export type FilterValue<V extends string | number> = V | typeof ALL;

export function useFilter<V extends string | number>(
    initial: FilterValue<V> = ALL,
) {
    const [selected, setSelected] = useState<FilterValue<V>>(initial);
    // Expose a plain value setter so FilterBar's generic inference works correctly.
    // React's Dispatch<SetStateAction<T>> includes the function-update overload,
    // which breaks the (value: FilterValue<V>) => void constraint on FilterBar.onChange.
    const update = useCallback((v: FilterValue<V>) => setSelected(v), []);
    const reset = useCallback(() => setSelected(ALL), []);
    const isAll = selected === ALL;
    return { selected, setSelected: update, reset, isAll };
}
