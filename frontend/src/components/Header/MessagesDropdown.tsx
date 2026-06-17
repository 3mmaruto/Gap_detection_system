import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IconDropdown from "./IconDropdown";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useConversation } from "@/contexts/ConversationContext";
import type { Conversation, ConversationUser } from "@/types/models.types";

function getOther(conv: Conversation, myId: number): ConversationUser | undefined {
    return conv.party1 === myId ? conv.user2 : conv.user1;
}

export default function MessagesDropdown() {
    const { conversations, loading } = useMessages();
    const { user } = useAuth();
    const { openById } = useConversation();
    const navigate = useNavigate();

    // Sort by last message timestamp desc
    const sorted = [...conversations].sort((a, b) => {
        const aTs = a.messages?.[0]?.timestamp ?? "";
        const bTs = b.messages?.[0]?.timestamp ?? "";
        return bTs > aTs ? 1 : -1;
    });

    // ── Badge logic ────────────────────────────────────────────────────────────
    // seenCount = the conversation count the user last "acknowledged" (opened dropdown).
    // null = initial load not yet finished → show no badge.
    const [seenCount, setSeenCount] = useState<number | null>(null);

    // Once the first fetch completes, record current count as the baseline
    // so pre-existing conversations don't trigger a badge.
    useEffect(() => {
        if (seenCount === null && !loading) {
            setSeenCount(conversations.length);
        }
    }, [conversations.length, loading, seenCount]);

    const badge = seenCount === null ? 0 : Math.max(0, sorted.length - seenCount);

    const handleOpen = () => setSeenCount(sorted.length);

    return (
        <IconDropdown
            icon="bi-chat"
            badge={badge}
            header="Messages"
            footerLabel="Show all messages"
            fullWidth
            onFooterClick={() => navigate("/messages")}
            onOpen={handleOpen}
        >
            {sorted.length === 0 && (
                <li>
                    <span className="dropdown-item text-muted small">No conversations</span>
                </li>
            )}
            {sorted.slice(0, 5).map((conv) => {
                const other = user ? getOther(conv, user.id) : undefined;
                if (!other) return null;
                const lastMsg = conv.messages?.[0];
                return (
                    <li key={conv.id}>
                        <button
                            className="dropdown-item d-flex gap-2 align-items-center py-2"
                            onClick={() => openById(conv.id, other)}
                        >
                            <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                style={{ width: 32, height: 32, fontSize: "0.72rem" }}
                            >
                                {other.first_name[0]?.toUpperCase()}
                                {other.last_name[0]?.toUpperCase()}
                            </div>
                            <div className="overflow-hidden text-start">
                                <p className="mb-0 small fw-semibold text-truncate">
                                    {other.first_name} {other.last_name}
                                </p>
                                {lastMsg && (
                                    <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                                        {lastMsg.text.length > 30
                                            ? lastMsg.text.slice(0, 30) + "…"
                                            : lastMsg.text}
                                    </span>
                                )}
                            </div>
                        </button>
                    </li>
                );
            })}
        </IconDropdown>
    );
}
