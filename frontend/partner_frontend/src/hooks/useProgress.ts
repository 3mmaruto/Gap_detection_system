import { useMemo } from "react";
import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import { ALL } from "./useFilter";
import type { FilterValue } from "./useFilter";

interface ProgressResponse {
    percent: number;
}

/** Curriculum completion percent for a student, optionally per subject. */
export function useProgress(
    studentId: number | undefined,
    subject: FilterValue<number> = ALL,
) {
    const path = useMemo(() => {
        if (studentId === undefined) return null;
        return endpoints.progress.forStudent(
            studentId,
            subject === ALL ? undefined : subject,
        );
    }, [studentId, subject]);

    const { data, loading, error } = useApi<ProgressResponse>(path);
    return { percent: data?.percent ?? 0, loading, error };
}
