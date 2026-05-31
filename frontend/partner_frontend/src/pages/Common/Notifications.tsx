import { useNotifications } from "@/hooks/useNotifications";
import { apiFetch } from "@/lib/api";
import type { NotificationType } from "@/types/models.types";

const TYPE_ICON: Record<NotificationType, string> = {
    message: "bi-chat-dots",
    grade: "bi-star",
    post: "bi-megaphone",
    system: "bi-info-circle",
};

const TYPE_COLOR: Record<NotificationType, string> = {
    message: "#6366f1",
    grade: "#f59e0b",
    post: "#10b981",
    system: "#64748b",
};

export default function NotificationsPage() {
    const { notifications, unseen, loading, refetch } = useNotifications();

    const markSeen = async (id: number) => {
        await apiFetch(`/notifications/v1/${id}/seen`, { method: "PATCH" });
        refetch();
    };

    const markAllSeen = async () => {
        await apiFetch("/notifications/v1/mark-all-seen", { method: "PATCH" });
        refetch();
    };

    return (
        <div className="container py-4" style={{ maxWidth: 680 }}>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="fw-bold mb-0">Notifications</h2>
                    {unseen > 0 && (
                        <span className="text-muted small">{unseen} unread</span>
                    )}
                </div>
                {unseen > 0 && (
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={markAllSeen}
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {loading && <p className="text-muted">Loading…</p>}

            {!loading && notifications.length === 0 && (
                <div className="text-center py-5 text-muted">
                    <i className="bi bi-bell-slash fs-1 d-block mb-2" />
                    <p>No notifications yet.</p>
                </div>
            )}

            <ul className="list-unstyled d-flex flex-column gap-2">
                {notifications.map((n) => {
                    const icon = TYPE_ICON[n.type] ?? "bi-bell";
                    const color = TYPE_COLOR[n.type] ?? "#6366f1";
                    return (
                        <li
                            key={n.id}
                            className="border rounded-3 p-3 d-flex gap-3 align-items-start"
                            style={{
                                background: n.seen ? "#fff" : "#f0f4ff",
                                borderColor: "#dde3f0",
                                cursor: n.seen ? "default" : "pointer",
                            }}
                            onClick={() => !n.seen && markSeen(n.id)}
                        >
                            {/* Icon */}
                            <div
                                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                style={{
                                    width: 38,
                                    height: 38,
                                    background: color + "22",
                                }}
                            >
                                <i className={`bi ${icon}`} style={{ color }} />
                            </div>

                            {/* Text */}
                            <div className="flex-grow-1 min-w-0">
                                <p
                                    className={`mb-0 ${n.seen ? "text-muted" : "fw-semibold"}`}
                                    style={{ color: n.seen ? undefined : "#1e1b4b" }}
                                >
                                    {n.text}
                                </p>
                                <small className="text-muted">
                                    {new Date(n.timestamp).toLocaleString()}
                                </small>
                            </div>

                            {/* Unread dot */}
                            {!n.seen && (
                                <div
                                    className="rounded-circle flex-shrink-0 mt-1"
                                    style={{
                                        width: 8,
                                        height: 8,
                                        background: "#6366f1",
                                    }}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
