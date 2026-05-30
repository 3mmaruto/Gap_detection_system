import { useMemo } from "react";
import { useApi } from "./useApi";
import type { Subject } from "@/types/models.types";

interface SubjectsOptions {
    levelId?: number;
    /** true = only return subjects the calling teacher teaches */
    mine?: boolean;
}

export function useSubjects({ levelId, mine }: SubjectsOptions = {}) {
    const path = useMemo(() => {
        const params: Record<string, string> = {};
        if (levelId != null) params.level_id = String(levelId);
        if (mine) params.mine = "true";
        const qs = new URLSearchParams(params).toString();
        return `/subjects/v1${qs ? `?${qs}` : ""}`;
    }, [levelId, mine]);

    const { data, loading, error, refetch } = useApi<Subject[]>(path);
    // Backend returns plain array (not paginated)
    return { subjects: Array.isArray(data) ? data : [], loading, error, refetch };
}
