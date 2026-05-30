import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import type { Notification } from "@/types/models.types";

export function useNotifications() {
    const { data, loading, error, refetch } = useApi<Notification[]>(
        endpoints.notifications.list,
    );
    const notifications = data ?? [];
    const unseen = notifications.filter((n) => !n.seen).length;
    return { notifications, unseen, loading, error, refetch };
}
