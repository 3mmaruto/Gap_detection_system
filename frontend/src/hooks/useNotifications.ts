import { useEffect } from "react";
import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import type { Notification } from "@/types/models.types";

const POLL_MS = 5000;

export function useNotifications() {
    const { data, loading, error, refetch } = useApi<Notification[]>(
        endpoints.notifications.list,
    );
    const notifications = data ?? [];
    const unseen = notifications.filter((n) => !n.seen).length;

    useEffect(() => {
        const id = setInterval(refetch, POLL_MS);
        return () => clearInterval(id);
    }, [refetch]);

    return { notifications, unseen, loading, error, refetch };
}
