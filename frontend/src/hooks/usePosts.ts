import { useMemo } from "react";
import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import { ALL } from "./useFilter";
import type { FilterValue } from "./useFilter";
import type { Post, PostType } from "@/types/models.types";
import type { Paginated } from "@/types/api.types";

export function usePosts(subject: FilterValue<number> = ALL, type?: PostType) {
    const path = useMemo(
        () =>
            endpoints.posts.list({
                ...(subject !== ALL ? { subject_id: subject } : {}),
                ...(type ? { type } : {}),
            }),
        [subject, type],
    );
    const { data, loading, error, refetch } = useApi<Paginated<Post>>(path);
    return { posts: data?.items ?? [], loading, error, refetch };
}
