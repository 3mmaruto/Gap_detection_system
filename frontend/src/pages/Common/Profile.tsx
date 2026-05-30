import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch, endpoints, isApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSubjects } from "@/hooks/useSubjects";
import { useLevels } from "@/hooks/useLevels";
import type { Subject } from "@/types/models.types";
import type {
    AnyUser,
    Student,
    StudentAcademicHistory,
    StudentCurrentLevel,
} from "@/types/models.types";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmt(val: string | null | undefined): string {
    return val ?? "—";
}

function fmtDate(val: string | null | undefined): string {
    if (!val) return "—";
    return new Date(val).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function initials(u: AnyUser): string {
    return `${u.first_name[0] ?? ""}${u.last_name[0] ?? ""}`.toUpperCase();
}

const ROLE_COLOR: Record<string, string> = {
    admin: "#4338ca",
    teacher: "#0e7490",
    student: "#15803d",
};

/* ── Field row ───────────────────────────────────────────────────────────── */

function FieldRow({
    label,
    value,
    editing,
    inputProps,
}: {
    label: string;
    value: string;
    editing: boolean;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
    return (
        <div className="row mb-3 align-items-center">
            <div className="col-5 col-md-4">
                <span
                    className="text-muted"
                    style={{
                        fontSize: ".72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                    }}
                >
                    {label}
                </span>
            </div>
            <div className="col-7 col-md-8">
                {editing && inputProps ? (
                    <input
                        className="form-control form-control-sm"
                        style={{ maxWidth: "22rem" }}
                        {...inputProps}
                    />
                ) : (
                    <span className="fw-medium" style={{ color: "#1e293b" }}>
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ── Section card ────────────────────────────────────────────────────────── */

function SectionCard({
    title,
    icon,
    children,
    action,
}: {
    title: string;
    icon: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div
            className="bg-white border rounded p-4 mb-3"
            style={{
                borderColor: "#dde3f0",
                borderRadius: ".75rem",
                boxShadow:
                    "0 1px 4px rgba(0,0,0,.05),0 4px 12px rgba(99,102,241,.04)",
            }}
        >
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h3
                    className="mb-0 d-flex align-items-center gap-2"
                    style={{
                        fontSize: ".95rem",
                        fontWeight: 700,
                        color: "#1e1b4b",
                    }}
                >
                    <i className={`bi ${icon}`} style={{ color: "#6366f1" }} />
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );
}

/* ── Teacher subjects section ────────────────────────────────────────────── */

interface TeacherAssignment {
    subject_id: number;
    subject_name: string;
    subject_name_ar: string | null;
    level_id: number;
    grade_level: string;
    curriculum_year: string;
    assigned_at: string;
}

function TeacherSubjectsSection({
    teacherId,
    isAdmin,
}: {
    teacherId: number;
    isAdmin: boolean;
}) {
    const { levels } = useLevels();
    const [selectedLevelId, setSelectedLevelId] = useState("");
    const { subjects } = useSubjects({
        levelId: selectedLevelId ? parseInt(selectedLevelId) : undefined,
    });

    const [assigned, setAssigned] = useState<TeacherAssignment[]>([]);
    const [loadingAssigned, setLoadingAssigned] = useState(true);
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        apiFetch<TeacherAssignment[]>(endpoints.users.subjects(teacherId))
            .then(setAssigned)
            .catch(() => setAssigned([]))
            .finally(() => setLoadingAssigned(false));
    }, [teacherId]);

    // Reset subject when level changes
    useEffect(() => {
        setSelectedSubjectId("");
    }, [selectedLevelId]);

    // Subjects in selected grade that aren't already assigned for that grade
    const assignedKey = (s: number, l: number) => `${s}-${l}`;
    const assignedKeys = new Set(
        assigned.map((a) => assignedKey(a.subject_id, a.level_id)),
    );
    const availableSubjects = subjects.filter(
        (s) =>
            !assignedKeys.has(
                assignedKey(s.id, parseInt(selectedLevelId || "0")),
            ),
    );

    const handleAdd = async () => {
        if (!selectedSubjectId || !selectedLevelId) return;
        setSaving(true);
        setErr(null);
        try {
            const updated = await apiFetch<TeacherAssignment[]>(
                endpoints.users.subjects(teacherId),
                {
                    method: "POST",
                    body: {
                        subject_id: parseInt(selectedSubjectId),
                        level_id: parseInt(selectedLevelId),
                    },
                },
            );
            setAssigned(updated);
            setSelectedSubjectId("");
        } catch (e) {
            setErr(isApiError(e) ? e.message : "Failed to assign");
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (subjectId: number, levelId: number) => {
        setSaving(true);
        setErr(null);
        try {
            const updated = await apiFetch<TeacherAssignment[]>(
                endpoints.users.removeSubject(teacherId, subjectId, levelId),
                { method: "DELETE" },
            );
            setAssigned(updated);
        } catch (e) {
            setErr(isApiError(e) ? e.message : "Failed to remove");
        } finally {
            setSaving(false);
        }
    };

    // Group assignments by grade for display
    const byGrade = assigned.reduce<Record<string, TeacherAssignment[]>>(
        (acc, a) => {
            const key = `${a.grade_level} — ${a.curriculum_year}`;
            (acc[key] ??= []).push(a);
            return acc;
        },
        {},
    );

    return (
        <SectionCard title="Subjects & Grades Taught" icon="bi-book-half">
            {err && (
                <div className="alert alert-danger py-2 small mb-3">{err}</div>
            )}

            {/* Assigned list grouped by grade */}
            {loadingAssigned ? (
                <p className="text-muted small">Loading…</p>
            ) : assigned.length === 0 ? (
                <p className="text-muted small fst-italic mb-3">
                    No assignments yet.
                </p>
            ) : (
                <div className="d-flex flex-column gap-3 mb-4">
                    {Object.entries(byGrade).map(([grade, items]) => (
                        <div key={grade}>
                            <p
                                className="mb-2 small fw-semibold"
                                style={{
                                    color: "#64748b",
                                    fontSize: ".72rem",
                                    textTransform: "uppercase",
                                    letterSpacing: ".05em",
                                }}
                            >
                                {grade}
                            </p>
                            <div className="d-flex flex-wrap gap-2">
                                {items.map((a) => (
                                    <span
                                        key={`${a.subject_id}-${a.level_id}`}
                                        className="d-inline-flex align-items-center gap-1 px-3 py-1"
                                        style={{
                                            background: "#e0e7ff",
                                            color: "#4338ca",
                                            fontWeight: 600,
                                            fontSize: ".82rem",
                                            borderRadius: "2rem",
                                            border: "1px solid #c7d2fe",
                                        }}
                                    >
                                        {a.subject_name}
                                        {a.subject_name_ar && (
                                            <span
                                                style={{
                                                    opacity: 0.55,
                                                    fontWeight: 400,
                                                    fontSize: ".75rem",
                                                }}
                                            >
                                                &nbsp;{a.subject_name_ar}
                                            </span>
                                        )}
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                className="btn-close ms-1"
                                                style={{ fontSize: ".5rem" }}
                                                aria-label="Remove"
                                                disabled={saving}
                                                onClick={() =>
                                                    handleRemove(
                                                        a.subject_id,
                                                        a.level_id,
                                                    )
                                                }
                                            />
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Admin: add form */}
            {isAdmin && (
                <div
                    className="rounded-3 p-3 d-flex flex-column gap-2"
                    style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <p
                        className="mb-1 small fw-semibold"
                        style={{ color: "#475569" }}
                    >
                        <i className="bi bi-plus-circle me-1" />
                        Assign a subject
                    </p>
                    <div className="d-flex gap-2 flex-wrap">
                        {/* Grade picker */}
                        <select
                            className="form-select form-select-sm"
                            style={{ maxWidth: "14rem" }}
                            value={selectedLevelId}
                            onChange={(e) => setSelectedLevelId(e.target.value)}
                            disabled={saving}
                        >
                            <option value="">Select grade…</option>
                            {levels.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.grade_level} — {l.curriculum_year}
                                </option>
                            ))}
                        </select>

                        {/* Subject picker — gated on grade */}
                        <select
                            className="form-select form-select-sm"
                            style={{ maxWidth: "14rem" }}
                            value={selectedSubjectId}
                            onChange={(e) =>
                                setSelectedSubjectId(e.target.value)
                            }
                            disabled={saving || !selectedLevelId}
                        >
                            <option value="">
                                {!selectedLevelId
                                    ? "Pick a grade first"
                                    : availableSubjects.length === 0
                                      ? "All subjects assigned for this grade"
                                      : "Select subject…"}
                            </option>
                            {availableSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                    {s.name_ar ? ` — ${s.name_ar}` : ""}
                                </option>
                            ))}
                        </select>

                        <button
                            className="btn btn-primary btn-sm px-3"
                            onClick={handleAdd}
                            disabled={
                                saving || !selectedSubjectId || !selectedLevelId
                            }
                        >
                            {saving ? "…" : "Assign"}
                        </button>
                    </div>
                </div>
            )}
        </SectionCard>
    );
}

/* ── Grades section ──────────────────────────────────────────────────────── */

interface PartGradeRow {
    id: number;
    subject_id: number;
    subject: { id: number; name: string; name_ar: string | null };
    assigned_by: number;
    assignedBy: { id: number; first_name: string; last_name: string };
    max_grade: number;
    value: number;
    label: string | null;
    assigned_at: string;
}

const LABEL_PRESETS = [
    "Midterm",
    "Final",
    "Quiz",
    "Assignment",
    "Oral",
    "Practical",
];

function GradesSection({
    studentId,
    canEdit,
}: {
    studentId: number;
    canEdit: boolean;
}) {
    const { subjects } = useSubjects();
    const [grades, setGrades] = useState<PartGradeRow[]>([]);
    const [loading, setLoading] = useState(true);

    // Add-grade form state
    const [subjectId, setSubjectId] = useState("");
    const [label, setLabel] = useState("");
    const [value, setValue] = useState("");
    const [maxGrade, setMaxGrade] = useState("100");
    const [adding, setAdding] = useState(false);
    const [formErr, setFormErr] = useState<string | null>(null);

    // Edit state
    const [editId, setEditId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [editMaxGrade, setEditMaxGrade] = useState("");
    const [editLabel, setEditLabel] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    const refresh = () => {
        apiFetch<PartGradeRow[]>(endpoints.grades.forStudent(studentId))
            .then(setGrades)
            .catch(() => setGrades([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
    }, [studentId]);

    const handleAdd = async () => {
        if (!subjectId || value === "" || maxGrade === "") return;
        setFormErr(null);
        setAdding(true);
        try {
            await apiFetch(endpoints.grades.create(), {
                method: "POST",
                body: {
                    student_id: studentId,
                    subject_id: parseInt(subjectId),
                    value: parseFloat(value),
                    max_grade: parseFloat(maxGrade),
                    label: label || undefined,
                },
            });
            setSubjectId("");
            setLabel("");
            setValue("");
            setMaxGrade("100");
            refresh();
        } catch (e) {
            setFormErr(isApiError(e) ? e.message : "Failed to add grade");
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (g: PartGradeRow) => {
        setEditId(g.id);
        setEditValue(String(g.value));
        setEditMaxGrade(String(g.max_grade));
        setEditLabel(g.label ?? "");
    };

    const handleEditSave = async () => {
        if (!editId) return;
        setEditSaving(true);
        try {
            await apiFetch(endpoints.grades.update(editId), {
                method: "PATCH",
                body: {
                    value: parseFloat(editValue),
                    max_grade: parseFloat(editMaxGrade),
                    label: editLabel || undefined,
                },
            });
            setEditId(null);
            refresh();
        } catch {
            // keep editing open
        } finally {
            setEditSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        await apiFetch(endpoints.grades.remove(id), { method: "DELETE" }).catch(
            () => null,
        );
        refresh();
    };

    // Group by subject
    const bySubject = grades.reduce<Record<string, PartGradeRow[]>>(
        (acc, g) => {
            const key = g.subject.name;
            (acc[key] ??= []).push(g);
            return acc;
        },
        {},
    );

    const pct = (v: number, m: number) => `${Math.round((v / m) * 100)}%`;
    const color = (v: number, m: number) => {
        const p = v / m;
        if (p >= 0.85) return "#15803d";
        if (p >= 0.6) return "#b45309";
        return "#dc2626";
    };

    return (
        <SectionCard title="Grade Marks" icon="bi-award">
            {loading ? (
                <p className="text-muted small">Loading…</p>
            ) : grades.length === 0 ? (
                <p className="text-muted small fst-italic mb-3">
                    No grades recorded yet.
                </p>
            ) : (
                <div className="d-flex flex-column gap-4 mb-4">
                    {Object.entries(bySubject).map(([subjectName, rows]) => (
                        <div key={subjectName}>
                            <p
                                className="mb-2 fw-semibold"
                                style={{
                                    fontSize: ".8rem",
                                    color: "#475569",
                                    textTransform: "uppercase",
                                    letterSpacing: ".05em",
                                }}
                            >
                                {subjectName}
                            </p>
                            <div className="d-flex flex-column gap-1">
                                {rows.map((g) =>
                                    editId === g.id ? (
                                        /* ── Edit row ── */
                                        <div
                                            key={g.id}
                                            className="d-flex gap-2 align-items-center flex-wrap p-2 rounded-2"
                                            style={{
                                                background: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                            }}
                                        >
                                            <input
                                                className="form-control form-control-sm"
                                                style={{ width: "5rem" }}
                                                placeholder="Label"
                                                value={editLabel}
                                                onChange={(e) =>
                                                    setEditLabel(e.target.value)
                                                }
                                            />
                                            <input
                                                className="form-control form-control-sm"
                                                style={{ width: "5rem" }}
                                                type="number"
                                                placeholder="Value"
                                                value={editValue}
                                                onChange={(e) =>
                                                    setEditValue(e.target.value)
                                                }
                                            />
                                            <span className="text-muted small">
                                                /
                                            </span>
                                            <input
                                                className="form-control form-control-sm"
                                                style={{ width: "5rem" }}
                                                type="number"
                                                placeholder="Max"
                                                value={editMaxGrade}
                                                onChange={(e) =>
                                                    setEditMaxGrade(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={handleEditSave}
                                                disabled={editSaving}
                                            >
                                                {editSaving ? "…" : "Save"}
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => setEditId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        /* ── Display row ── */
                                        <div
                                            key={g.id}
                                            className="d-flex align-items-center gap-3 px-2 py-1 rounded-2"
                                            style={{ background: "#f8fafc" }}
                                        >
                                            {g.label && (
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: "#e0e7ff",
                                                        color: "#4338ca",
                                                        fontWeight: 500,
                                                        fontSize: ".75rem",
                                                    }}
                                                >
                                                    {g.label}
                                                </span>
                                            )}
                                            <span
                                                className="fw-bold"
                                                style={{
                                                    color: color(
                                                        g.value,
                                                        g.max_grade,
                                                    ),
                                                    fontFamily: "monospace",
                                                    fontSize: ".95rem",
                                                }}
                                            >
                                                {g.value}
                                                <span className="fw-normal text-muted">
                                                    /{g.max_grade}
                                                </span>
                                            </span>
                                            <span className="text-muted small">
                                                ({pct(g.value, g.max_grade)})
                                            </span>
                                            <span
                                                className="text-muted ms-auto"
                                                style={{ fontSize: ".72rem" }}
                                            >
                                                by {g.assignedBy.first_name}{" "}
                                                {g.assignedBy.last_name}
                                            </span>
                                            {canEdit && (
                                                <div className="d-flex gap-1">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary py-0 px-2"
                                                        onClick={() =>
                                                            startEdit(g)
                                                        }
                                                    >
                                                        <i
                                                            className="bi bi-pencil"
                                                            style={{
                                                                fontSize:
                                                                    ".7rem",
                                                            }}
                                                        />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger py-0 px-2"
                                                        onClick={() =>
                                                            handleDelete(g.id)
                                                        }
                                                    >
                                                        <i
                                                            className="bi bi-trash"
                                                            style={{
                                                                fontSize:
                                                                    ".7rem",
                                                            }}
                                                        />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add grade form — teacher/admin only */}
            {canEdit && (
                <div
                    className="rounded-3 p-3"
                    style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <p
                        className="mb-2 small fw-semibold"
                        style={{ color: "#475569" }}
                    >
                        <i className="bi bi-plus-circle me-1" />
                        Add grade
                    </p>
                    {formErr && (
                        <div className="alert alert-danger py-2 small mb-2">
                            {formErr}
                        </div>
                    )}
                    <div className="d-flex gap-2 flex-wrap align-items-end">
                        {/* Subject */}
                        <div>
                            <label className="form-label small mb-1">
                                Subject
                            </label>
                            <select
                                className="form-select form-select-sm"
                                style={{ minWidth: "11rem" }}
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                            >
                                <option value="">Select…</option>
                                {subjects.map((s: Subject) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Label */}
                        <div>
                            <label className="form-label small mb-1">
                                Label
                            </label>
                            <input
                                className="form-control form-control-sm"
                                style={{ width: "8rem" }}
                                list="grade-label-presets"
                                placeholder="e.g. Midterm"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                            />
                            <datalist id="grade-label-presets">
                                {LABEL_PRESETS.map((l) => (
                                    <option key={l} value={l} />
                                ))}
                            </datalist>
                        </div>

                        {/* Value */}
                        <div>
                            <label className="form-label small mb-1">
                                Score
                            </label>
                            <input
                                className="form-control form-control-sm"
                                style={{ width: "5.5rem" }}
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="0"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </div>

                        {/* Max */}
                        <div>
                            <label className="form-label small mb-1">
                                Out of
                            </label>
                            <input
                                className="form-control form-control-sm"
                                style={{ width: "5.5rem" }}
                                type="number"
                                min="1"
                                step="0.5"
                                placeholder="100"
                                value={maxGrade}
                                onChange={(e) => setMaxGrade(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn btn-primary btn-sm align-self-end"
                            onClick={handleAdd}
                            disabled={adding || !subjectId || value === ""}
                        >
                            {adding ? "…" : "Post grade"}
                        </button>
                    </div>
                </div>
            )}
        </SectionCard>
    );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

interface FormState {
    first_name: string;
    last_name: string;
    brith_date: string;
    phone: string;
    gender: string;
    nationality: string;
    parent_phone: string;
    father_name: string;
    mother_name: string;
}

function userToForm(u: AnyUser): FormState {
    const s = u.role === "student" ? (u as Student) : null;
    return {
        first_name: u.first_name,
        last_name: u.last_name,
        brith_date: u.brith_date ?? "",
        phone: u.phone ?? "",
        gender: u.gender ?? "",
        nationality: u.nationality ?? "",
        parent_phone: s?.parent_phone ?? "",
        father_name: s?.father_name ?? "",
        mother_name: s?.mother_name ?? "",
    };
}

export default function ProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { user: me } = useAuth();

    const [profile, setProfile] = useState<AnyUser | null>(null);
    const [currentLevels, setCurrentLevels] = useState<StudentCurrentLevel[]>(
        [],
    );
    const [history, setHistory] = useState<StudentAcademicHistory[]>([]);
    const [teacherLevelIds, setTeacherLevelIds] = useState<Set<number>>(
        new Set(),
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<FormState | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const userId = Number(id);
    const isAdmin = me?.role === "admin";

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setEditing(false);
        setConfirmOpen(false);
        setSaveSuccess(false);
        apiFetch<AnyUser>(endpoints.users.byId(userId))
            .then((u) => {
                setProfile(u);
                setForm(userToForm(u));
                if (u.role === "student") {
                    apiFetch<StudentAcademicHistory[]>(
                        endpoints.students.history(userId),
                    )
                        .then(setHistory)
                        .catch(() => {});
                    apiFetch<StudentCurrentLevel[]>(
                        endpoints.students.levels(userId),
                    )
                        .then((levels) => {
                            setCurrentLevels(levels);
                            // If the viewer is a teacher, fetch their assignments and
                            // compute the level intersection to decide access.
                            if (me?.role === "teacher" && me.id) {
                                apiFetch<TeacherAssignment[]>(
                                    endpoints.users.subjects(me.id),
                                )
                                    .then((assignments) => {
                                        const studentLevelIds = new Set(
                                            levels.map((l) => l.level_id),
                                        );
                                        const shared = new Set(
                                            assignments
                                                .map((a) => a.level_id)
                                                .filter((lid) =>
                                                    studentLevelIds.has(lid),
                                                ),
                                        );
                                        setTeacherLevelIds(shared);
                                    })
                                    .catch(() => {});
                            }
                        })
                        .catch(() => {});
                }
            })
            .catch((e) =>
                setError(isApiError(e) ? e.message : "Failed to load profile"),
            )
            .finally(() => setLoading(false));
    }, [id]);

    const setField =
        (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

    const handleEdit = () => {
        setSaveSuccess(false);
        setSaveError(null);
        setEditing(true);
    };
    const handleCancel = () => {
        if (profile) setForm(userToForm(profile));
        setEditing(false);
        setConfirmOpen(false);
    };

    const handleConfirm = async () => {
        if (!form) return;
        setSaving(true);
        setSaveError(null);
        try {
            const updated = await apiFetch<AnyUser>(
                endpoints.users.byId(userId),
                {
                    method: "PATCH",
                    body: form,
                },
            );
            setProfile(updated);
            setForm(userToForm(updated));
            setEditing(false);
            setConfirmOpen(false);
            setSaveSuccess(true);
        } catch (e) {
            setSaveError(isApiError(e) ? e.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading…</span>
                </div>
            </div>
        );
    }

    if (error || !profile || !form) {
        return (
            <div className="alert alert-danger m-3">
                {error ?? "Profile not found."}
            </div>
        );
    }

    // Students can only view their own profile
    if (me?.role === "student" && userId !== me.id) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center gap-3 text-center py-5">
                <i
                    className="bi bi-lock-fill fs-1"
                    style={{ color: "#6366f1" }}
                />
                <h5 className="fw-bold mb-1" style={{ color: "#1e1b4b" }}>
                    Unauthorized 403
                </h5>
                <p className="text-muted mb-0" style={{ maxWidth: 340 }}>
                    You can only view your own profile.
                </p>
            </div>
        );
    }

    const isStudent = profile.role === "student";
    const roleColor = ROLE_COLOR[profile.role] ?? "#6366f1";

    // Teachers can see private student sections only if they teach the student
    const teachesStudent =
        isAdmin || (me?.role === "teacher" && teacherLevelIds.size > 0);

    const editBtn =
        isAdmin && !editing ? (
            <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleEdit}
            >
                <i className="bi bi-pencil me-1" />
                Edit
            </button>
        ) : null;

    const saveBar = editing ? (
        <div className="d-flex gap-2 mt-4 pt-3 border-top">
            <button
                className="btn btn-primary btn-sm px-4"
                onClick={() => setConfirmOpen(true)}
            >
                <i className="bi bi-floppy me-1" />
                Save Changes
            </button>
            <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleCancel}
            >
                Cancel
            </button>
        </div>
    ) : null;

    return (
        <div style={{ maxWidth: 860 }}>
            {saveSuccess && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3 py-2">
                    <i className="bi bi-check-circle-fill" />
                    Profile updated successfully.
                    <button
                        type="button"
                        className="btn-close ms-auto"
                        onClick={() => setSaveSuccess(false)}
                    />
                </div>
            )}

            {/* ── Avatar hero ── */}
            <div
                className="bg-white border rounded p-4 mb-3 d-flex align-items-center gap-4"
                style={{
                    borderColor: "#dde3f0",
                    borderRadius: ".75rem",
                    boxShadow: "0 1px 4px rgba(0,0,0,.05)",
                }}
            >
                <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold fs-3 text-white"
                    style={{ width: 72, height: 72, background: roleColor }}
                >
                    {initials(profile)}
                </div>
                <div className="flex-grow-1 min-width-0">
                    <h2
                        className="mb-1 fw-bold"
                        style={{ fontSize: "1.3rem", color: "#1e1b4b" }}
                    >
                        {profile.first_name} {profile.last_name}
                    </h2>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                        <span
                            className="badge text-capitalize px-2 py-1"
                            style={{
                                background: roleColor,
                                fontSize: ".78rem",
                            }}
                        >
                            {profile.role}
                        </span>
                        <span className="text-muted small">
                            ID #{profile.id}
                        </span>
                        {profile.nationality && (
                            <span className="text-muted small">
                                · {profile.nationality}
                            </span>
                        )}
                    </div>
                </div>
                {editBtn}
            </div>

            {/* ── Personal Information ── */}
            <SectionCard title="Personal Information" icon="bi-person">
                <FieldRow
                    label="First Name"
                    value={fmt(profile.first_name)}
                    editing={editing}
                    inputProps={{
                        value: form.first_name,
                        onChange: setField("first_name"),
                    }}
                />
                <FieldRow
                    label="Last Name"
                    value={fmt(profile.last_name)}
                    editing={editing}
                    inputProps={{
                        value: form.last_name,
                        onChange: setField("last_name"),
                    }}
                />
                <FieldRow
                    label="Date of Birth"
                    value={fmtDate(profile.brith_date)}
                    editing={editing}
                    inputProps={{
                        type: "date",
                        value: form.brith_date,
                        onChange: setField("brith_date"),
                    }}
                />
                <FieldRow
                    label="Gender"
                    value={fmt(profile.gender)}
                    editing={editing}
                    inputProps={{
                        value: form.gender,
                        onChange: setField("gender"),
                        placeholder: "e.g. Male",
                    }}
                />
                <FieldRow
                    label="Nationality"
                    value={fmt(profile.nationality)}
                    editing={editing}
                    inputProps={{
                        value: form.nationality,
                        onChange: setField("nationality"),
                    }}
                />
                <FieldRow
                    label="Phone"
                    value={fmt(profile.phone)}
                    editing={editing}
                    inputProps={{
                        type: "tel",
                        value: form.phone,
                        onChange: setField("phone"),
                    }}
                />
                {saveBar}
            </SectionCard>

            {/* ── Student contact ── */}
            {isStudent && (
                <SectionCard title="Student Contact Details" icon="bi-people">
                    <FieldRow
                        label="Parent Phone"
                        value={fmt((profile as Student).parent_phone)}
                        editing={editing}
                        inputProps={{
                            type: "tel",
                            value: form.parent_phone,
                            onChange: setField("parent_phone"),
                        }}
                    />
                    <FieldRow
                        label="Father Name"
                        value={fmt((profile as Student).father_name)}
                        editing={editing}
                        inputProps={{
                            value: form.father_name,
                            onChange: setField("father_name"),
                        }}
                    />
                    <FieldRow
                        label="Mother Name"
                        value={fmt((profile as Student).mother_name)}
                        editing={editing}
                        inputProps={{
                            value: form.mother_name,
                            onChange: setField("mother_name"),
                        }}
                    />
                </SectionCard>
            )}

            {/* ── Academic history ── */}
            {isStudent && (isAdmin || teachesStudent || userId === me?.id) && (
                <SectionCard
                    title="Academic History"
                    icon="bi-journal-bookmark"
                >
                    {/* Current grade level(s) — pinned to top */}
                    {currentLevels.length > 0 && (
                        <div className="mb-4">
                            <p
                                className="mb-2"
                                style={{
                                    fontSize: ".72rem",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: ".05em",
                                    color: "#94a3b8",
                                }}
                            >
                                Current Level
                            </p>
                            <div className="d-flex flex-wrap gap-2">
                                {currentLevels.map((cl) => (
                                    <div
                                        key={cl.level_id}
                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
                                        style={{
                                            background: "#eef2ff",
                                            border: "1px solid #c7d2fe",
                                        }}
                                    >
                                        <i
                                            className="bi bi-mortarboard-fill"
                                            style={{
                                                color: "#6366f1",
                                                fontSize: ".9rem",
                                            }}
                                        />
                                        <div>
                                            <span
                                                className="fw-bold"
                                                style={{
                                                    color: "#1e1b4b",
                                                    fontSize: ".92rem",
                                                }}
                                            >
                                                {cl.level.grade_level}
                                            </span>
                                            <span
                                                className="text-muted ms-2"
                                                style={{ fontSize: ".78rem" }}
                                            >
                                                {cl.level.curriculum_year}
                                            </span>
                                        </div>
                                        <span
                                            className="badge ms-1"
                                            style={{
                                                background:
                                                    cl.success_status ===
                                                    "passed"
                                                        ? "#dcfce7"
                                                        : cl.success_status ===
                                                            "failed"
                                                          ? "#fee2e2"
                                                          : "#f1f5f9",
                                                color:
                                                    cl.success_status ===
                                                    "passed"
                                                        ? "#15803d"
                                                        : cl.success_status ===
                                                            "failed"
                                                          ? "#dc2626"
                                                          : "#475569",
                                                fontSize: ".68rem",
                                                fontWeight: 600,
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {cl.success_status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Previous academic history */}
                    {history.length === 0 ? (
                        <p className="text-muted small mb-0">
                            No previous academic history recorded.
                        </p>
                    ) : (
                        <>
                            <p
                                className="mb-2"
                                style={{
                                    fontSize: ".72rem",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: ".05em",
                                    color: "#94a3b8",
                                }}
                            >
                                Previous History
                            </p>
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr style={{ background: "#f5f7fe" }}>
                                            {[
                                                "Grade",
                                                "Country",
                                                "School",
                                                "GPA",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="text-muted"
                                                    style={{
                                                        fontSize: ".72rem",
                                                        fontWeight: 700,
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h, i) => (
                                            <tr key={i}>
                                                <td className="fw-medium">
                                                    {h.grade_level}
                                                </td>
                                                <td>{fmt(h.country)}</td>
                                                <td>{fmt(h.school_name)}</td>
                                                <td>
                                                    {h.gpa != null
                                                        ? h.gpa.toFixed(2)
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </SectionCard>
            )}

            {/* ── Teacher subjects ── */}
            {profile.role === "teacher" && (
                <TeacherSubjectsSection
                    teacherId={profile.id}
                    isAdmin={isAdmin}
                />
            )}

            {/* ── Grade marks — hidden from students; teachers only if they teach this student ── */}
            {profile.role === "student" &&
                me?.role !== "student" &&
                teachesStudent && (
                    <GradesSection
                        studentId={profile.id}
                        canEdit={isAdmin || me?.role === "teacher"}
                    />
                )}

            {/* ── Account details (read-only) ── */}
            <SectionCard title="Account Details" icon="bi-shield-check">
                <FieldRow
                    label="User ID"
                    value={`#${profile.id}`}
                    editing={false}
                />
                <FieldRow label="Role" value={profile.role} editing={false} />
                <FieldRow
                    label="Joined"
                    value={fmtDate(profile.created_timestamp)}
                    editing={false}
                />
                <FieldRow
                    label="Last Login"
                    value={fmtDate(profile.last_login_at)}
                    editing={false}
                />
            </SectionCard>

            {/* ── Confirmation overlay ── */}
            {confirmOpen && (
                <div
                    className="position-fixed bottom-0 start-0 end-0 p-3"
                    style={{
                        zIndex: 1055,
                        background: "rgba(15,23,42,.55)",
                        backdropFilter: "blur(3px)",
                    }}
                >
                    <div
                        className="mx-auto bg-white rounded-3 p-4"
                        style={{
                            maxWidth: 500,
                            boxShadow: "0 8px 32px rgba(0,0,0,.22)",
                        }}
                    >
                        <h5
                            className="fw-bold mb-1"
                            style={{ color: "#1e1b4b" }}
                        >
                            Confirm changes
                        </h5>
                        <p className="text-muted small mb-3">
                            Save profile updates for{" "}
                            <strong>
                                {form.first_name} {form.last_name}
                            </strong>
                            ? This cannot be undone.
                        </p>
                        {saveError && (
                            <div className="alert alert-danger py-2 small mb-3">
                                {saveError}
                            </div>
                        )}
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-primary px-4"
                                onClick={handleConfirm}
                                disabled={saving}
                            >
                                {saving ? "Saving…" : "Confirm & Save"}
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => setConfirmOpen(false)}
                                disabled={saving}
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
