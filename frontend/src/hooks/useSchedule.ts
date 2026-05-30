import { useMemo } from "react";
import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import type { WeekSchedule } from "@/types/schedule.types";

export function useSchedule(subjectId?: number, levelId?: number) {
    const path = useMemo(() => {
        const params = new URLSearchParams();
        if (subjectId) params.set('subject_id', String(subjectId));
        else if (levelId) params.set('level_id', String(levelId));
        const qs = params.toString();
        return qs ? `${endpoints.schedule.week()}?${qs}` : endpoints.schedule.week();
    }, [subjectId, levelId]);

    const { data, loading, error, refetch } = useApi<WeekSchedule>(path);

    const schedule = useMemo((): WeekSchedule | null => {
        if (!data) return null;
        if (Array.isArray(data)) return null;
        return data;
    }, [data]);

    return { schedule, loading, error, refetch };
}
