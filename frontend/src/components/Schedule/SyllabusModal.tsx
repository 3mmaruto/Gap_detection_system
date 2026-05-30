import { useState, useEffect } from "react";
import { apiFetch, endpoints, isApiError } from "@/lib/api";
import type { WeekdayShort, ClassPeriod } from "@/types/schedule.types";

interface SyllabusItem {
    id: number;
    topic: { id: number; name: string };
}

interface Props {
    scheduleItemId: number;
    subjectName: string;
    day: WeekdayShort;
    period: ClassPeriod;
    onClose: () => void;
    onSaved: () => void;
}

export default function SyllabusModal({
    scheduleItemId, subjectName, day, period, onClose, onSaved,
}: Props) {
    const [items, setItems] = useState<SyllabusItem[]>([]);
    const [topicName, setTopicName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loadingItems, setLoadingItems] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiFetch<SyllabusItem[]>(endpoints.schedule.syllabus(scheduleItemId))
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoadingItems(false));
    }, [scheduleItemId]);

    const handleAdd = async () => {
        if (!topicName.trim()) return;
        setError(null);
        setSubmitting(true);
        try {
            const item = await apiFetch<SyllabusItem>(
                endpoints.schedule.syllabus(scheduleItemId),
                { method: "POST", body: { topic_name: topicName.trim() } },
            );
            setItems((prev) => [...prev, item]);
            setTopicName("");
            onSaved();
        } catch (err) {
            setError(isApiError(err) ? err.message : "Failed to add topic.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,.4)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
                <div className="modal-content rounded-3 border-0 shadow">
                    <div className="modal-header border-0 pb-0">
                        <div>
                            <h5 className="modal-title fw-bold mb-0" style={{ color: "#1e1b4b" }}>
                                Syllabus — {subjectName}
                            </h5>
                            <small className="text-muted">{day} · Period {period}</small>
                        </div>
                        <button className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger py-2 small">{error}</div>
                        )}

                        {/* Existing items */}
                        {loadingItems ? (
                            <p className="text-muted small">Loading…</p>
                        ) : items.length === 0 ? (
                            <p className="text-muted small fst-italic mb-2">
                                No syllabus items yet.
                            </p>
                        ) : (
                            <ul className="list-group list-group-flush mb-3">
                                {items.map((item, i) => (
                                    <li
                                        key={item.id}
                                        className="list-group-item px-0 py-1 d-flex gap-2 align-items-center"
                                    >
                                        <span
                                            className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{
                                                width: 22, height: 22,
                                                background: "#e0e7ff",
                                                color: "#6366f1",
                                                fontSize: "0.7rem",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {i + 1}
                                        </span>
                                        <span className="small">{item.topic.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Add new topic */}
                        <div className="input-group input-group-sm">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Topic / lesson title…"
                                value={topicName}
                                onChange={(e) => setTopicName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleAdd}
                                disabled={submitting || !topicName.trim()}
                            >
                                {submitting ? "…" : "Add"}
                            </button>
                        </div>
                    </div>

                    <div className="modal-footer border-0 pt-0">
                        <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
