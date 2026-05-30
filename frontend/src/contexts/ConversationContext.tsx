import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { apiFetch, endpoints } from "@/lib/api";
import type { ConversationUser } from "@/types/models.types";

export interface ActiveConversation {
    conversationId: number;
    otherUser: ConversationUser;
}

interface ConversationContextType {
    active: ActiveConversation | null;
    /** Open a known conversation by ID + other user info (e.g. from the Messages list). */
    openById: (conversationId: number, otherUser: ConversationUser) => void;
    /** Find-or-create a conversation with a user, then open it. */
    openWithUser: (user: ConversationUser) => Promise<void>;
    close: () => void;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
    const [active, setActive] = useState<ActiveConversation | null>(null);

    const openById = useCallback((conversationId: number, otherUser: ConversationUser) => {
        setActive({ conversationId, otherUser });
    }, []);

    const openWithUser = useCallback(async (user: ConversationUser) => {
        try {
            const conv = await apiFetch<{ id: number }>(
                endpoints.conversations.withUser(user.id),
                { method: "POST" },
            );
            setActive({ conversationId: conv.id, otherUser: user });
        } catch {
            // network/auth error — silently ignore
        }
    }, []);

    const close = useCallback(() => setActive(null), []);

    return (
        <ConversationContext.Provider value={{ active, openById, openWithUser, close }}>
            {children}
        </ConversationContext.Provider>
    );
}

export function useConversation() {
    const ctx = useContext(ConversationContext);
    if (!ctx) throw new Error("useConversation must be inside <ConversationProvider>");
    return ctx;
}
