import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch, endpoints, isApiError } from "@/lib/api";
import { useSubjects } from "@/hooks/useSubjects";
import { POST_TYPES, POST_TYPE_LABELS } from "@/types/models.types";
import type { Post, PostType } from "@/types/models.types";

const VALID_TYPES = new Set<string>(POST_TYPES);
function isPostType(v: string | null): v is PostType {
    return v !== null && VALID_TYPES.has(v);
}

interface PostFormProps {
    /** When provided, the form is in edit mode. */
    initial?: Post;
    onSuccess?: (post: Post) => void;
}

export default function PostForm({ initial, onSuccess }: PostFormProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { subjects } = useSubjects();

    const paramType = searchParams.get("type");
    const defaultType: PostType = initial?.type ?? (isPostType(paramType) ? paramType : "ANNOUNCEMENT");

    const [title, setTitle] = useState(initial?.title ?? "");
    const [type, setType] = useState<PostType>(defaultType);
    const [content, setContent] = useState(initial?.content ?? "");
    const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? "");
    const [subjectId, setSubjectId] = useState<string>(
        initial?.subject_id != null ? String(initial.subject_id) : "",
    );

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = initial != null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const body = {
            title,
            type,
            content: content || undefined,
            thumbnail_url: thumbnailUrl || undefined,
            subject_id: subjectId ? parseInt(subjectId) : undefined,
        };

        try {
            let saved: Post;
            if (isEdit) {
                saved = await apiFetch<Post>(endpoints.posts.byId(initial.id), {
                    method: "PATCH",
                    body,
                });
            } else {
                saved = await apiFetch<Post>(endpoints.posts.list(), {
                    method: "POST",
                    body,
                });
            }
            onSuccess?.(saved);
            if (!onSuccess) navigate(-1);
        } catch (err) {
            setError(isApiError(err) ? err.message : "Failed to save post.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
            {error && (
                <div className="alert alert-danger py-2 mb-0" role="alert">
                    {error}
                </div>
            )}

            {/* Type */}
            <div>
                <label className="form-label fw-semibold">Post type</label>
                <div className="d-flex gap-2 flex-wrap">
                    {POST_TYPES.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className={`btn btn-sm ${type === t ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => setType(t)}
                        >
                            {POST_TYPE_LABELS[t]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Title */}
            <div className="form-floating">
                <input
                    id="post-title"
                    type="text"
                    className="form-control"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={200}
                />
                <label htmlFor="post-title">Title</label>
            </div>

            {/* Content */}
            <div className="form-floating">
                <textarea
                    id="post-content"
                    className="form-control"
                    placeholder="Content (optional)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ minHeight: "7rem" }}
                />
                <label htmlFor="post-content">Content (optional)</label>
            </div>

            {/* Thumbnail URL */}
            <div className="form-floating">
                <input
                    id="post-thumbnail"
                    type="url"
                    className="form-control"
                    placeholder="https://..."
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                />
                <label htmlFor="post-thumbnail">Thumbnail URL (optional)</label>
            </div>

            {/* Live thumbnail preview */}
            {thumbnailUrl && (
                <div>
                    <p className="mb-1 small text-muted">Preview</p>
                    <img
                        src={thumbnailUrl}
                        alt="thumbnail preview"
                        className="rounded-2"
                        style={{ maxHeight: "8rem", maxWidth: "100%", objectFit: "cover" }}
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                </div>
            )}

            {/* Subject */}
            <div className="form-floating">
                <select
                    id="post-subject"
                    className="form-select"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                >
                    <option value="">— None —</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
                <label htmlFor="post-subject">Subject (optional)</label>
            </div>

            {/* Actions */}
            <div className="d-flex gap-2 justify-content-end">
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={submitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || !title}
                >
                    {submitting ? "Saving…" : isEdit ? "Save changes" : "Publish post"}
                    &nbsp;
                    <i className="bi bi-send" />
                </button>
            </div>
        </form>
    );
}
