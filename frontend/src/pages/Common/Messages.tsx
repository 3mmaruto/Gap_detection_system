import Card from "@/components/ui/Card";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useConversation } from "@/contexts/ConversationContext";
import type { Conversation, ConversationUser } from "@/types/models.types";

function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({ user }: { user: ConversationUser }) {
    return (
        <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
            style={{ width: 48, height: 48, fontSize: "0.85rem" }}
        >
            {user.first_name[0]?.toUpperCase()}
            {user.last_name[0]?.toUpperCase()}
        </div>
    );
}

function getOther(conv: Conversation, myId: number): ConversationUser | undefined {
    return conv.party1 === myId ? conv.user2 : conv.user1;
}

export default function MessagesPage() {
    const { conversations, loading } = useMessages();
    const { user } = useAuth();
    const { openById } = useConversation();

    // Sort by last message timestamp desc (most recent first)
    const sorted = [...conversations].sort((a, b) => {
        const aTs = a.messages?.[0]?.timestamp ?? "";
        const bTs = b.messages?.[0]?.timestamp ?? "";
        return bTs > aTs ? 1 : -1;
    });

    return (
        <Card title="Messages">
            {loading ? (
                <p className="text-muted small py-3 text-center">Loading…</p>
            ) : sorted.length === 0 ? (
                <p className="text-muted text-center py-5">
                    <i className="bi bi-chat-dots fs-1 d-block mb-2 opacity-25" />
                    No conversations yet.
                </p>
            ) : (
                <div className="list-group list-group-flush rounded-3 overflow-hidden">
                    {sorted.map((conv) => {
                        const other = user ? getOther(conv, user.id) : undefined;
                        if (!other) return null;
                        const lastMsg = conv.messages?.[0];

                        return (
                            <button
                                key={conv.id}
                                type="button"
                                className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 px-3 border-0 border-bottom"
                                onClick={() => openById(conv.id, other)}
                            >
                                <Avatar user={other} />

                                <div className="flex-grow-1 overflow-hidden text-start">
                                    <div className="fw-semibold text-truncate">
                                        {other.first_name} {other.last_name}
                                    </div>
                                    {lastMsg ? (
                                        <div className="text-muted small text-truncate">
                                            {lastMsg.sender_id === user?.id ? "You: " : ""}
                                            {lastMsg.text}
                                        </div>
                                    ) : (
                                        <div className="text-muted small fst-italic">
                                            No messages yet
                                        </div>
                                    )}
                                </div>

                                {lastMsg && (
                                    <span
                                        className="text-muted flex-shrink-0"
                                        style={{ fontSize: "0.72rem" }}
                                    >
                                        {formatTime(lastMsg.timestamp)}
                                    </span>
                                )}

                                <i className="bi bi-chevron-right text-muted flex-shrink-0 small" />
                            </button>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
