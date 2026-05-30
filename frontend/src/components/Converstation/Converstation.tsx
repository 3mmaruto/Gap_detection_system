import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch, endpoints } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useConversation } from "@/contexts/ConversationContext";
import type { Message } from "@/types/models.types";

const POLL_MS = 500;

function initials(first: string, last: string) {
    return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ConversationWindow() {
    const { active, close } = useConversation();
    const { user } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // Track message count so we only scroll when genuinely new messages arrive
    const prevCountRef = useRef(0);

    // ---------- fetch helpers ----------

    const loadMessages = useCallback(
        async (convId: number, signal?: AbortSignal) => {
            try {
                const data = await apiFetch<Message[]>(
                    endpoints.conversations.messages(convId),
                    { signal },
                );
                setMessages(data);
            } catch {
                /* aborted or network error — ignore */
            }
        },
        [],
    );

    // Silently merge in new messages from the poll without touching loading state
    const pollMessages = useCallback(async (convId: number) => {
        try {
            const data = await apiFetch<Message[]>(
                endpoints.conversations.messages(convId),
            );
            setMessages((prev) => {
                // Skip the state update (and re-render) when nothing changed
                const lastPrevId = prev[prev.length - 1]?.id;
                const lastDataId = data[data.length - 1]?.id;
                if (data.length === prev.length && lastDataId === lastPrevId)
                    return prev;
                return data;
            });
        } catch {
            /* ignore poll errors */
        }
    }, []);

    // ---------- lifecycle ----------

    // Initial load + reset when conversation changes
    useEffect(() => {
        if (!active) {
            setMessages([]);
            setText("");
            prevCountRef.current = 0;
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        loadMessages(active.conversationId, controller.signal).finally(() =>
            setLoading(false),
        );
        setTimeout(() => inputRef.current?.focus(), 50);
        return () => controller.abort();
    }, [active?.conversationId, loadMessages]);

    // Polling — runs every POLL_MS while a conversation is open
    useEffect(() => {
        if (!active) return;
        const id = setInterval(
            () => pollMessages(active.conversationId),
            POLL_MS,
        );
        return () => clearInterval(id);
    }, [active?.conversationId, pollMessages]);

    // Scroll to bottom only when new messages arrive
    useEffect(() => {
        if (messages.length > prevCountRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevCountRef.current = messages.length;
    }, [messages]);

    // ---------- send ----------

    const send = async () => {
        if (!text.trim() || !active || sending) return;
        setSending(true);
        const draft = text.trim();
        setText("");
        try {
            const msg = await apiFetch<Message>(
                endpoints.conversations.messages(active.conversationId),
                { method: "POST", body: { text: draft } },
            );
            setMessages((prev) => [...prev, msg]);
        } catch {
            setText(draft); // restore on failure
        } finally {
            setSending(false);
        }
    };

    if (!active) return null;

    const { otherUser } = active;

    return (
        <div className="chat-window bg-white d-flex flex-column shadow-lg">
            {/* Header */}
            <div
                className="d-flex align-items-center gap-2 px-3 py-2 flex-shrink-0"
                style={{ background: "var(--sms-header-bg)" }}
            >
                <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                    style={{ width: 36, height: 36, fontSize: "0.8rem" }}
                >
                    {initials(otherUser.first_name, otherUser.last_name)}
                </div>
                <span
                    className="text-white fw-semibold flex-grow-1 text-truncate"
                    style={{ fontSize: "0.95rem" }}
                >
                    {otherUser.first_name} {otherUser.last_name}
                </span>
                {/* Live indicator dot */}
                <span
                    className="rounded-circle bg-success flex-shrink-0"
                    title="Polling for new messages"
                    style={{ width: 8, height: 8 }}
                />
                <button
                    className="btn btn-link text-white p-1 lh-1"
                    aria-label="Close"
                    onClick={close}
                >
                    <i className="bi bi-x-lg fs-5" />
                </button>
            </div>

            {/* Messages */}
            <div
                className="flex-grow-1 overflow-y-auto px-3 py-2 d-flex flex-column gap-2"
                style={{ minHeight: 0 }}
            >
                {loading ? (
                    <p className="text-muted text-center small my-auto">
                        Loading…
                    </p>
                ) : messages.length === 0 ? (
                    <p className="text-muted text-center small my-auto">
                        No messages yet — say hi!
                    </p>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}
                            >
                                <div
                                    className={`px-3 py-2 rounded-3 small ${isMe ? "text-white" : "bg-light text-dark"}`}
                                    style={{
                                        maxWidth: "78%",
                                        background: isMe
                                            ? "var(--sms-primary)"
                                            : undefined,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {msg.text}
                                </div>
                                <span
                                    className="text-muted"
                                    style={{
                                        fontSize: "0.65rem",
                                        marginTop: 2,
                                    }}
                                >
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-2 py-2 border-top d-flex gap-2 flex-shrink-0">
                <input
                    ref={inputRef}
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Aa"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            send();
                        }
                    }}
                    disabled={sending}
                />
                <button
                    className="btn btn-primary btn-sm px-3 flex-shrink-0"
                    onClick={send}
                    disabled={!text.trim() || sending}
                    aria-label="Send"
                >
                    <i className="bi bi-send-fill" />
                </button>
            </div>
        </div>
    );
}
