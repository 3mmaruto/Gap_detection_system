import { useState, useEffect } from "react";
import { apiFetch, endpoints, isApiError } from "@/lib/api";
import { useSubjects } from "@/hooks/useSubjects";
import type { WeekdayShort, ClassPeriod } from "@/types/schedule.types";

interface Props {
    day: WeekdayShort;
    period: ClassPeriod;
    currentSubjectId?: number;
    currentSubjectName?: string;
    onClose: () => void;
    onSaved: () => void;
}

export default function ScheduleSlotModal({
    day, period, currentSubjectId, currentSubjectName, onClose, onSaved,
}: Props) {
    const { subjects } = useSubjects();
    const [subjectId, setSubjectId] = useState(
        currentSubjectId ? String(currentSubjectId) : "",
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSubjectId(currentSubjectId ? String(currentSubjectId) : "");
    }, [currentSubjectId]);

    const handleSave = async () => {
        if (!subjectId) return;
        setError(null);
        setSubmitting(true);
        try {
            await apiFetch(endpoints.schedule.slot(), {
                method: "PUT",
                body: { day, period, subject_id: parseInt(subjectId) },
            });
            onSaved();
        } catch (err) {
            setError(isApiError(err) ? err.message : "Failed to save slot.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = async () => {
        setError(null);
        setSubmitting(true);
        try {
            await apiFetch(
                `${endpoints.schedule.slot()}?day=${day}&period=${period}`,
                { method: "DELETE" },
            );
            onSaved();
        } catch (err) {
            setError(isApiError(err) ? err.message : "Failed to clear slot.");
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
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
                <div className="modal-content rounded-3 border-0 shadow">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold" style={{ color: "#1e1b4b" }}>
                            {day} · Period {period}
                        </h5>
                        <button className="btn-close" onClick={onClose} />
                    </div>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger py-2 small">{error}</div>
                        )}
                        {currentSubjectName && (
                            <p className="small text-muted mb-2">
                                Currently: <strong>{currentSubjectName}</strong>
                            </p>
                        )}
                        <div className="form-floating">
                            <select
                                id="slot-subject"
                                className="form-select"
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                            >
                                <option value="">— Select subject —</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            <label htmlFor="slot-subject">Subject</label>
                        </div>
                    </div>
                    <div className="modal-footer border-0 pt-0 d-flex gap-2">
                        {currentSubjectId && (
                            <button
                                className="btn btn-sm btn-outline-danger me-auto"
                                onClick={handleClear}
                                disabled={submitting}
                            >
                                Clear slot
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={handleSave}
                            disabled={submitting || !subjectId}
                        >
                            {submitting ? "Saving…" : "Assign"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
