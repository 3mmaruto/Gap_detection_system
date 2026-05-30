import { useMemo } from "react";
import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import type { WeekSchedule } from "@/types/schedule.types";

export function useSchedule(subjectId?: number) {
    const path = useMemo(
        () => subjectId
            ? `${endpoints.schedule.week()}?subject_id=${subjectId}`
            : endpoints.schedule.week(),
        [subjectId],
    );

    const { data, loading, error, refetch } = useApi<WeekSchedule>(path);

    const schedule = useMemo((): WeekSchedule | null => {
        if (!data) return null;
        if (Array.isArray(data)) return null;
        return data;
    }, [data]);

    return { schedule, loading, error, refetch };
}
