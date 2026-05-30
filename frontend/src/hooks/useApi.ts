import { useCallback, useEffect, useState } from "react";
import { apiFetch, isApiError } from "@/lib/api";

export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Fetches `path` from the API and tracks loading/error state.
 * Re-runs whenever `path` changes; pass `null` to skip fetching.
 */
export function useApi<T>(path: string | null): AsyncState<T> {
    const [data, setData] = useState<T | null>(null);
    const [fetching, setFetching] = useState<boolean>(path !== null);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const refetch = useCallback(() => setTick((t) => t + 1), []);

    useEffect(() => {
        if (path === null) return;
        const controller = new AbortController();

        // Starting an async fetch is the canonical, intended use of
        // setState-in-effect (syncing React with an external system).
        /* eslint-disable react-hooks/set-state-in-effect */
        setFetching(true);
        setError(null);
        /* eslint-enable react-hooks/set-state-in-effect */

        apiFetch<T>(path, { signal: controller.signal })
            .then((result) => setData(result))
            .catch((err: unknown) => {
                if (controller.signal.aborted) return;
                setError(isApiError(err) ? err.message : "Unexpected error");
            })
            .finally(() => {
                if (!controller.signal.aborted) setFetching(false);
            });

        return () => controller.abort();
    }, [path, tick]);

    // When there's nothing to fetch, we're not loading.
    const loading = path === null ? false : fetching;

    return { data, loading, error, refetch };
}
