import { useMemo } from "react";
import { useApi } from "./useApi";
import { useDebounce } from "./useDebounce";
import { endpoints } from "@/lib/api";
import { ALL } from "./useFilter";
import type { FilterValue } from "./useFilter";
import type { AnyUser, Role, Student } from "@/types/models.types";
import type { Paginated } from "@/types/api.types";

interface UsersOptions {
    role?: FilterValue<Role>;
    search?: string;
}

/** Admin "Manage Users" data source. */
export function useUsers({ role = ALL, search = "" }: UsersOptions = {}) {
    const debouncedSearch = useDebounce(search);
    const path = useMemo(
        () =>
            endpoints.users.list({
                page_size: 500,
                role: role === ALL ? undefined : role,
                search: debouncedSearch || undefined,
            }),
        [role, debouncedSearch],
    );
    const { data, loading, error, refetch } = useApi<Paginated<AnyUser>>(path);
    return { users: data?.items ?? [], loading, error, refetch };
}

/** Teacher "My Students" data source. */
export function useStudents(search = "") {
    const debouncedSearch = useDebounce(search);
    const path = useMemo(
        () =>
            endpoints.students.list({
                page_size: 500,
                search: debouncedSearch || undefined,
            }),
        [debouncedSearch],
    );
    const { data, loading, error, refetch } =
        useApi<Paginated<Student>>(path);
    return { students: data?.items ?? [], loading, error, refetch };
}
