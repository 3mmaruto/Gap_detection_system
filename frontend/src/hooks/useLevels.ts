import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import type { Level } from "@/types/models.types";

/** Fetch all grade levels.  mine=true → only levels the calling teacher teaches. */
export function useLevels(mine = false) {
    const { data, loading, error } = useApi<Level[]>(endpoints.levels.list(mine));
    return { levels: data ?? [], loading, error };
}
