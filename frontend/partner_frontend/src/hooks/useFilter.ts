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
    const reset = useCallback(() => setSelected(ALL), []);
    const isAll = selected === ALL;
    return { selected, setSelected, reset, isAll };
}
