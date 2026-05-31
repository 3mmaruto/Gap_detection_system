import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import type { Conversation } from "@/types/models.types";

export function useMessages() {
    const { data, loading, error, refetch } = useApi<Conversation[]>(
        endpoints.conversations.list,
    );
    const conversations = data ?? [];
    return { conversations, count: conversations.length, loading, error, refetch };
}
