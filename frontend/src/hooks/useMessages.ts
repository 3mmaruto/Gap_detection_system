import { useEffect } from "react";
import { useApi } from "./useApi";
import { endpoints } from "@/lib/api";
import type { Conversation } from "@/types/models.types";

const POLL_MS = 5000;

export function useMessages() {
    const { data, loading, error, refetch } = useApi<Conversation[]>(
        endpoints.conversations.list,
    );
    const conversations = data ?? [];

    // Keep the conversation list fresh so the inbox and dropdown stay up to date
    useEffect(() => {
        const id = setInterval(refetch, POLL_MS);
        return () => clearInterval(id);
    }, [refetch]);

    return { conversations, count: conversations.length, loading, error, refetch };
}
