import { ALL } from "@/hooks/useFilter";
import type { FilterValue } from "@/hooks/useFilter";

export interface FilterOption<V extends string | number> {
    value: V;
    label: string;
}

interface FilterBarProps<V extends string | number> {
    options: FilterOption<V>[];
    value: FilterValue<V>;
    onChange: (value: FilterValue<V>) => void;
    includeAll?: boolean;
    allLabel?: string;
}

/**
 * One data-driven, selectable filter row. Replaces the three hardcoded
 * button lists (subject / grade / user) — feed it options + state.
 */
export default function FilterBar<V extends string | number>({
    options,
    value,
    onChange,
    includeAll = true,
    allLabel = "All",
}: FilterBarProps<V>) {
    const buttons: FilterOption<V | typeof ALL>[] = includeAll
        ? [{ value: ALL, label: allLabel }, ...options]
        : options;

    return (
        <div className="d-flex flex-wrap gap-2 gap-md-3">
            {buttons.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        key={String(opt.value)}
                        type="button"
                        className={`btn mb-3 filter-bar-btn ${
                            active ? "btn-primary" : "btn-outline-primary"
                        }`}
                        onClick={() => onChange(opt.value)}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
