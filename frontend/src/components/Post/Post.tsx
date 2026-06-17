import { useNavigate } from "react-router-dom";
import type { Post as PostModel } from "@/types/models.types";
import { POST_TYPE_LABELS } from "@/types/models.types";

const TYPE_COLORS: Record<string, string> = {
    ANNOUNCEMENT: "#f59e0b",
    CURRICULUM_POST: "#6366f1",
    HOMEWORK: "#10b981",
};

interface PostProps {
    post: PostModel;
    onClick?: (post: PostModel) => void;
}

export default function Post({ post, onClick }: PostProps) {
    const navigate = useNavigate();
    const accent = TYPE_COLORS[post.type] ?? "#6366f1";
    const handleClick = () => onClick ? onClick(post) : navigate(`/posts/${post.id}`);

    return (
        <div
            role="button"
            tabIndex={0}
            className="border rounded-3 d-flex flex-column overflow-hidden"
            style={{
                width: "9rem",
                borderColor: "#dde3f0",
                background: "#f5f7fe",
                boxShadow: "0 1px 4px rgba(99,102,241,.07)",
                cursor: "pointer",
                transition: "box-shadow .15s ease, transform .15s ease",
            }}
            onClick={handleClick}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = "0 4px 14px rgba(99,102,241,.18)";
                el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = "0 1px 4px rgba(99,102,241,.07)";
                el.style.transform = "translateY(0)";
            }}
        >
            {/* Thumbnail */}
            <div
                className="d-flex align-items-center justify-content-center"
                style={{ height: "5rem", background: accent + "22" }}
            >
                {post.thumbnail_url ? (
                    <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <i
                        className={
                            post.type === "HOMEWORK"
                                ? "bi bi-journal-check fs-2"
                                : post.type === "CURRICULUM_POST"
                                  ? "bi bi-book fs-2"
                                  : "bi bi-megaphone fs-2"
                        }
                        style={{ color: accent }}
                    />
                )}
            </div>

            {/* Body */}
            <div className="p-2 d-flex flex-column gap-1">
                <span
                    className="badge rounded-pill"
                    style={{ background: accent + "22", color: accent, fontSize: "0.6rem" }}
                >
                    {POST_TYPE_LABELS[post.type]}
                </span>
                <p
                    className="mb-0 small fw-semibold text-truncate"
                    title={post.title}
                    style={{ color: "#1e1b4b", lineHeight: 1.3 }}
                >
                    {post.title}
                </p>
                {post.author_alias && (
                    <span
                        className="d-flex align-items-center gap-1 text-truncate"
                        style={{ fontSize: "0.6rem", color: "#6366f1", fontWeight: 600 }}
                    >
                        <i className="bi bi-building" />
                        {post.author_alias}
                    </span>
                )}
                <span
                    className="d-flex align-items-center gap-1"
                    style={{ fontSize: "0.62rem", color: "#94a3b8" }}
                >
                    <i className="bi bi-calendar3" />
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </span>
            </div>
        </div>
    );
}
