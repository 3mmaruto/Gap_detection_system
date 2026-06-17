import { useNavigate } from "react-router-dom";
import IconDropdown from "./IconDropdown";
import { useNotifications } from "@/hooks/useNotifications";
import { apiFetch, endpoints } from "@/lib/api";

const TYPE_ICON: Record<string, string> = {
    message: "bi-chat-dots",
    grade: "bi-star",
    post: "bi-megaphone",
    system: "bi-info-circle",
};

export default function NotificationsDropdown() {
    const { notifications, unseen, refetch } = useNotifications();
    const navigate = useNavigate();

    const markSeen = async (id: number) => {
        await apiFetch(endpoints.notifications.markSeen(id), { method: "PATCH" }).catch(() => null);
        refetch();
    };

    const handleOpen = async () => {
        if (unseen === 0) return;
        await apiFetch(endpoints.notifications.markAllSeen, { method: "PATCH" }).catch(() => null);
        refetch();
    };

    return (
        <IconDropdown
            icon="bi-bell"
            badge={unseen}
            header="Notifications"
            footerLabel="Show all notifications"
            fullWidth
            onFooterClick={() => navigate("/notifications")}
            onOpen={handleOpen}
        >
            {notifications.length === 0 && (
                <li>
                    <span className="dropdown-item text-muted small">No notifications</span>
                </li>
            )}
            {notifications.slice(0, 5).map((n) => (
                <li key={n.id}>
                    <button
                        className="dropdown-item d-flex gap-2 align-items-start py-2"
                        style={{ background: n.seen ? undefined : "#f0f4ff" }}
                        onClick={() => { if (!n.seen) markSeen(n.id); }}
                    >
                        <i
                            className={`bi ${TYPE_ICON[n.type] ?? "bi-bell"} mt-1 flex-shrink-0`}
                            style={{ color: "#6366f1" }}
                        />
                        <div className="text-start">
                            <p className={`mb-0 small ${n.seen ? "text-muted" : "fw-semibold"}`}>
                                {n.text}
                            </p>
                            <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                                {new Date(n.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        {!n.seen && (
                            <div
                                className="rounded-circle ms-auto mt-1 flex-shrink-0"
                                style={{ width: 7, height: 7, background: "#6366f1" }}
                            />
                        )}
                    </button>
                </li>
            ))}
        </IconDropdown>
    );
}
