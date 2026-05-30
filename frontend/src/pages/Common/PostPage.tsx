import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { endpoints } from "@/lib/api";
import { POST_TYPE_LABELS } from "@/types/models.types";
import type { Post, PostAttachment } from "@/types/models.types";

/* ── Attachment helpers ────────────────────────────────────────────────────── */

type FileKind = "image" | "pdf" | "word" | "excel" | "archive" | "file";

function fileKind(filename: string | null): FileKind {
    const ext = filename?.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx"].includes(ext)) return "word";
    if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
    return "file";
}

const KIND_ICON: Record<FileKind, string> = {
    image:   "bi-file-image",
    pdf:     "bi-file-earmark-pdf",
    word:    "bi-file-earmark-word",
    excel:   "bi-file-earmark-spreadsheet",
    archive: "bi-file-earmark-zip",
    file:    "bi-file-earmark",
};

const KIND_COLOR: Record<FileKind, string> = {
    image:   "#6366f1",
    pdf:     "#ef4444",
    word:    "#2563eb",
    excel:   "#16a34a",
    archive: "#b45309",
    file:    "#64748b",
};

function AttachmentCard({ att }: { att: PostAttachment }) {
    const kind  = fileKind(att.filename);
    const color = KIND_COLOR[kind];
    const name  = att.filename ?? att.url.split("/").pop() ?? "Attachment";
    const isImage = kind === "image";

    return (
        <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            download={att.filename ?? true}
            className="text-decoration-none"
            style={{ display: "block" }}
        >
            <div
                className="d-flex flex-column overflow-hidden rounded-3 border"
                style={{
                    width: "10rem",
                    borderColor: "#dde3f0",
                    background: "#f8fafc",
                    boxShadow: "0 1px 4px rgba(0,0,0,.05)",
                    transition: "box-shadow .15s, transform .15s",
                    cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = "0 4px 14px rgba(99,102,241,.18)";
                    el.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.boxShadow = "0 1px 4px rgba(0,0,0,.05)";
                    el.style.transform = "translateY(0)";
                }}
            >
                {/* Preview area */}
                <div
                    className="d-flex align-items-center justify-content-center"
                    style={{ height: "6rem", background: color + "15" }}
                >
                    {isImage ? (
                        <img
                            src={att.url}
                            alt={name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : (
                        <i className={`bi ${KIND_ICON[kind]} fs-1`} style={{ color }} />
                    )}
                </div>

                {/* Label */}
                <div className="px-2 py-2 d-flex align-items-center gap-1">
                    <i
                        className={`bi ${KIND_ICON[kind]}`}
                        style={{ color, fontSize: ".75rem", flexShrink: 0 }}
                    />
                    <span
                        className="text-truncate"
                        title={name}
                        style={{ fontSize: ".72rem", color: "#334155", fontWeight: 500 }}
                    >
                        {name}
                    </span>
                    <i
                        className="bi bi-download ms-auto"
                        style={{ fontSize: ".68rem", color: "#94a3b8", flexShrink: 0 }}
                    />
                </div>
            </div>
        </a>
    );
}

/* ── Type badge colours ────────────────────────────────────────────────────── */

const TYPE_ACCENT: Record<string, string> = {
    ANNOUNCEMENT:    "#f59e0b",
    CURRICULUM_POST: "#6366f1",
    HOMEWORK:        "#10b981",
};

/* ── Main page ─────────────────────────────────────────────────────────────── */

export default function PostPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: post, loading, error } = useApi<Post>(
        id ? endpoints.posts.byId(Number(id)) : null,
    );

    /* ── Loading / error states ── */
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "12rem" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading…</span>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div
                className="d-flex flex-column align-items-center justify-content-center gap-3 text-center"
                style={{ minHeight: "12rem" }}
            >
                <i className="bi bi-exclamation-circle fs-1 text-danger" />
                <p className="text-muted mb-0">{error ?? "Post not found."}</p>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left me-1" /> Go back
                </button>
            </div>
        );
    }

    const accent      = TYPE_ACCENT[post.type] ?? "#6366f1";
    const attachments = post.attachments ?? [];
    const imageAtts   = attachments.filter((a) => fileKind(a.filename) === "image");
    const otherAtts   = attachments.filter((a) => fileKind(a.filename) !== "image");
    const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    return (
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>

            {/* Back button */}
            <button
                className="btn btn-sm btn-outline-secondary mb-3 d-flex align-items-center gap-1"
                onClick={() => navigate(-1)}
            >
                <i className="bi bi-arrow-left" /> Back
            </button>

            {/* ── Hero thumbnail ── */}
            {post.thumbnail_url && (
                <div
                    className="rounded-4 overflow-hidden mb-4"
                    style={{ height: "260px", background: "#f1f5f9" }}
                >
                    <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </div>
            )}

            {/* ── Header card ── */}
            <div
                className="rounded-4 p-4 mb-4"
                style={{
                    background: "#fff",
                    border: "1px solid #dde3f0",
                    boxShadow: "0 1px 4px rgba(0,0,0,.04), 0 6px 18px rgba(99,102,241,.06)",
                }}
            >
                {/* Type + subject badges */}
                <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                    <span
                        className="badge rounded-pill"
                        style={{
                            background: accent + "20",
                            color: accent,
                            fontSize: ".75rem",
                            fontWeight: 600,
                            padding: "0.35em 0.85em",
                        }}
                    >
                        <i
                            className={`bi me-1 ${
                                post.type === "HOMEWORK"
                                    ? "bi-journal-check"
                                    : post.type === "CURRICULUM_POST"
                                    ? "bi-book"
                                    : "bi-megaphone"
                            }`}
                        />
                        {POST_TYPE_LABELS[post.type]}
                    </span>

                    {post.subject && (
                        <span
                            className="badge rounded-pill"
                            style={{
                                background: "#e0e7ff",
                                color: "#4338ca",
                                fontSize: ".75rem",
                                fontWeight: 500,
                                padding: "0.35em 0.85em",
                            }}
                        >
                            <i className="bi bi-book-half me-1" />
                            {post.subject.name}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1
                    className="mb-3"
                    style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e1b4b", lineHeight: 1.25 }}
                >
                    {post.title}
                </h1>

                {/* Meta row */}
                <div
                    className="d-flex align-items-center gap-3 flex-wrap pt-3"
                    style={{ borderTop: "1px solid #f1f5f9" }}
                >
                    {(post.author_alias || post.author) && (
                        <span className="d-flex align-items-center gap-1" style={{ fontSize: ".82rem", color: "#64748b" }}>
                            <i
                                className={post.author_alias ? "bi bi-building" : "bi bi-person-circle"}
                                style={{ color: accent }}
                            />
                            {post.author_alias
                                ? <strong style={{ color: "#4338ca" }}>{post.author_alias}</strong>
                                : `${post.author!.first_name} ${post.author!.last_name}`}
                        </span>
                    )}
                    <span className="d-flex align-items-center gap-1" style={{ fontSize: ".82rem", color: "#64748b" }}>
                        <i className="bi bi-calendar3" style={{ color: accent }} />
                        {formattedDate}
                    </span>
                    {attachments.length > 0 && (
                        <span className="d-flex align-items-center gap-1" style={{ fontSize: ".82rem", color: "#64748b" }}>
                            <i className="bi bi-paperclip" style={{ color: accent }} />
                            {attachments.length} attachment{attachments.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Content ── */}
            {post.content && (
                <div
                    className="rounded-4 p-4 mb-4"
                    style={{
                        background: "#fff",
                        border: "1px solid #dde3f0",
                        boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                        lineHeight: 1.8,
                        color: "#1e293b",
                        fontSize: ".97rem",
                        whiteSpace: "pre-wrap",
                    }}
                >
                    {post.content}
                </div>
            )}

            {/* ── Attachments ── */}
            {attachments.length > 0 && (
                <div
                    className="rounded-4 p-4 mb-4"
                    style={{
                        background: "#fff",
                        border: "1px solid #dde3f0",
                        boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                    }}
                >
                    <h2
                        className="mb-4 d-flex align-items-center gap-2"
                        style={{ fontSize: "1rem", fontWeight: 700, color: "#1e1b4b" }}
                    >
                        <i className="bi bi-paperclip" style={{ color: accent }} />
                        Attachments
                        <span
                            className="badge rounded-pill ms-1"
                            style={{ background: accent + "20", color: accent, fontSize: ".7rem" }}
                        >
                            {attachments.length}
                        </span>
                    </h2>

                    {/* Image gallery strip */}
                    {imageAtts.length > 0 && (
                        <div className="mb-4">
                            <p
                                className="mb-2"
                                style={{ fontSize: ".75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}
                            >
                                Images
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                {imageAtts.map((att) => (
                                    <AttachmentCard key={att.id} att={att} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other files */}
                    {otherAtts.length > 0 && (
                        <div>
                            {imageAtts.length > 0 && (
                                <p
                                    className="mb-2"
                                    style={{ fontSize: ".75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em" }}
                                >
                                    Files
                                </p>
                            )}
                            <div className="d-flex flex-wrap gap-3">
                                {otherAtts.map((att) => (
                                    <AttachmentCard key={att.id} att={att} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
