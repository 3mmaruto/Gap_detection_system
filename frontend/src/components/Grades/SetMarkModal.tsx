import { useState, useEffect } from "react";
import { apiFetch, endpoints, isApiError } from "@/lib/api";
import { useSubjects } from "@/hooks/useSubjects";
import type { PartGrade } from "@/types/models.types";

const LABEL_PRESETS = ["Midterm", "Final", "Quiz", "Assignment", "Oral", "Practical"];

function pct(v: number, m: number) {
    return Math.round((v / m) * 100);
}
function pctStyle(v: number, m: number): React.CSSProperties {
    const p = v / m;
    const color = p >= 0.85 ? "#15803d" : p >= 0.6 ? "#b45309" : "#dc2626";
    return { color, fontWeight: 600, fontSize: ".8rem" };
}

interface Props {
    studentId: number;
    studentName: string;
    onClose: () => void;
}

export default function SetMarkModal({ studentId, studentName, onClose }: Props) {
    const { subjects } = useSubjects();

    const [grades, setGrades] = useState<PartGrade[]>([]);
    const [loadingGrades, setLoadingGrades] = useState(true);

    const [subjectId, setSubjectId] = useState("");
    const [label, setLabel] = useState("");
    const [value, setValue] = useState("");
    const [maxGrade, setMaxGrade] = useState("100");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const loadGrades = () => {
        setLoadingGrades(true);
        apiFetch<PartGrade[]>(endpoints.grades.forStudent(studentId))
            .then(setGrades)
            .catch(() => setGrades([]))
            .finally(() => setLoadingGrades(false));
    };

    useEffect(() => { loadGrades(); }, [studentId]);

    const handleSubmit = async () => {
        if (!subjectId || value === "" || maxGrade === "") return;
        setError(null);
        setSaving(true);
        try {
            await apiFetch(endpoints.grades.create(), {
                method: "POST",
                body: {
                    student_id: studentId,
                    subject_id: parseInt(subjectId),
                    value: parseFloat(value),
                    max_grade: parseFloat(maxGrade),
                    label: label.trim() || undefined,
                },
            });
            setSubjectId(""); setLabel(""); setValue(""); setMaxGrade("100");
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
            loadGrades();
        } catch (e) {
            setError(isApiError(e) ? e.message : "Failed to save grade");
        } finally {
            setSaving(false);
        }
    };

    // Group by subject name
    const bySubject = grades.reduce<Record<string, PartGrade[]>>((acc, g) => {
        const key = g.subject?.name ?? `Subject ${g.subject_id}`;
        (acc[key] ??= []).push(g);
        return acc;
    }, {});

    return (
        <>
            {/* Modal */}
            <div
                className="modal d-block"
                style={{ zIndex: 1055 }}
                onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 500 }}>
                    <div className="modal-content">

                        {/* Header */}
                        <div className="modal-header py-2" style={{ background: "var(--sms-header-bg)" }}>
                            <h5 className="modal-title text-white d-flex align-items-center gap-2" style={{ fontSize: "1rem" }}>
                                <i className="bi bi-award-fill" />
                                Set Mark — {studentName}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
                        </div>

                        {/* Body */}
                        <div className="modal-body">

                            {/* ── Add grade form ── */}
                            <div className="rounded-3 p-3 mb-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                <p className="mb-3 small fw-semibold" style={{ color: "#475569" }}>
                                    <i className="bi bi-plus-circle me-1" />Add new grade
                                </p>

                                {error  && <div className="alert alert-danger  py-2 small mb-2">{error}</div>}
                                {saved  && <div className="alert alert-success py-2 small mb-2"><i className="bi bi-check-circle me-1" />Grade saved!</div>}

                                {/* Subject */}
                                <div className="mb-2">
                                    <label className="form-label small fw-semibold mb-1">Subject</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={subjectId}
                                        onChange={(e) => setSubjectId(e.target.value)}
                                    >
                                        <option value="">Select subject…</option>
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Label */}
                                <div className="mb-2">
                                    <label className="form-label small fw-semibold mb-1">Label</label>
                                    <input
                                        className="form-control form-control-sm"
                                        list="smark-label-presets"
                                        placeholder="e.g. Midterm"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                    />
                                    <datalist id="smark-label-presets">
                                        {LABEL_PRESETS.map((l) => <option key={l} value={l} />)}
                                    </datalist>
                                </div>

                                {/* Score / Max */}
                                <div className="d-flex gap-2 mb-3 align-items-end">
                                    <div className="flex-grow-1">
                                        <label className="form-label small fw-semibold mb-1">Score</label>
                                        <input
                                            className="form-control form-control-sm"
                                            type="number" min="0" step="0.5" placeholder="0"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        />
                                    </div>
                                    <span className="text-muted fw-bold pb-1">/</span>
                                    <div className="flex-grow-1">
                                        <label className="form-label small fw-semibold mb-1">Out of</label>
                                        <input
                                            className="form-control form-control-sm"
                                            type="number" min="1" step="0.5" placeholder="100"
                                            value={maxGrade}
                                            onChange={(e) => setMaxGrade(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary btn-sm w-100"
                                    onClick={handleSubmit}
                                    disabled={saving || !subjectId || value === ""}
                                >
                                    {saving ? "Saving…" : "Post grade"}
                                </button>
                            </div>

                            {/* ── Existing grades ── */}
                            <p className="mb-2 small fw-semibold" style={{ color: "#475569" }}>
                                <i className="bi bi-list-check me-1" />Existing grades
                            </p>
                            {loadingGrades ? (
                                <p className="text-muted small">Loading…</p>
                            ) : grades.length === 0 ? (
                                <p className="text-muted small fst-italic">No grades recorded yet.</p>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {Object.entries(bySubject).map(([subjectName, rows]) => (
                                        <div key={subjectName}>
                                            <p
                                                className="mb-1 fw-semibold small text-uppercase"
                                                style={{ fontSize: ".72rem", color: "#64748b", letterSpacing: ".05em" }}
                                            >
                                                {subjectName}
                                            </p>
                                            <div className="d-flex flex-column gap-1">
                                                {rows.map((g) => (
                                                    <div
                                                        key={g.id}
                                                        className="d-flex align-items-center gap-2 px-2 py-1 rounded-2"
                                                        style={{ background: "#f8fafc", border: "1px solid #e8ecf5" }}
                                                    >
                                                        {g.label && (
                                                            <span
                                                                className="badge"
                                                                style={{ background: "#e0e7ff", color: "#4338ca", fontSize: ".72rem" }}
                                                            >
                                                                {g.label}
                                                            </span>
                                                        )}
                                                        <span style={{ fontFamily: "monospace", fontSize: ".9rem", fontWeight: 700 }}>
                                                            {g.value}
                                                            <span style={{ fontWeight: 400, color: "#64748b" }}>/{g.max_grade}</span>
                                                        </span>
                                                        <span style={pctStyle(g.value, g.max_grade)}>
                                                            {pct(g.value, g.max_grade)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer py-2">
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop */}
            <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
        </>
    );
}
