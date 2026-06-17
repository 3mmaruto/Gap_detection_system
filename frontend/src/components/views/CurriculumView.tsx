import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import FilterBar from "@/components/Filters/FilterBar";
import PostSection from "@/components/Post/PostSection";
import { useSubjects } from "@/hooks/useSubjects";
import { useLevels } from "@/hooks/useLevels";
import { usePosts } from "@/hooks/usePosts";
import { useFilter } from "@/hooks/useFilter";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, endpoints } from "@/lib/api";
import { ALL } from "@/hooks/useFilter";
import { POST_TYPE_LABELS } from "@/types/models.types";
import type { PostType, PartGrade } from "@/types/models.types";

const CURRICULUM_TYPES: { value: PostType; label: string }[] = [
    { value: "CURRICULUM_POST", label: POST_TYPE_LABELS.CURRICULUM_POST },
    { value: "HOMEWORK", label: POST_TYPE_LABELS.HOMEWORK },
];

/* ── Grade colour helpers ──────────────────────────────────────────────────── */
function pct(v: number, m: number) { return Math.round((v / m) * 100); }
function gradeColor(v: number, m: number) {
    const p = v / m;
    return p >= 0.85 ? "#15803d" : p >= 0.6 ? "#b45309" : "#dc2626";
}

/* ── My Marks panel (student-only) ────────────────────────────────────────── */
function GradesPanel({ grades }: { grades: PartGrade[] }) {
    if (grades.length === 0) {
        return (
            <p className="text-muted small fst-italic mb-0">
                No marks recorded for this subject yet.
            </p>
        );
    }
    return (
        <div className="d-flex flex-column gap-2">
            {grades.map((g) => (
                <div
                    key={g.id}
                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
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
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: ".95rem" }}>
                        {g.value}
                        <span style={{ fontWeight: 400, color: "#64748b" }}>/{g.max_grade}</span>
                    </span>
                    <span className="fw-semibold" style={{ color: gradeColor(g.value, g.max_grade), fontSize: ".85rem" }}>
                        {pct(g.value, g.max_grade)}%
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ── Section header ────────────────────────────────────────────────────────── */
function SectionTitle({ icon, label }: { icon: string; label: string }) {
    return (
        <h2
            className="mb-3 d-flex align-items-center gap-2"
            style={{ fontSize: ".95rem", fontWeight: 700, color: "#1e1b4b" }}
        >
            <i className={`bi ${icon}`} style={{ color: "#6366f1" }} />
            {label}
        </h2>
    );
}

/* ── Main view ─────────────────────────────────────────────────────────────── */
export default function CurriculumView() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isStudent = user?.role === "student";
    const isTeacher = user?.role === "teacher";
    const canPost   = user?.role === "admin" || isTeacher;

    const { selected: level,   setSelected: setLevel   } = useFilter<number>();
    const { selected: subject, setSelected: setSubject } = useFilter<number>();
    const { selected: type,    setSelected: setType    } = useFilter<PostType>();

    const { levels } = useLevels(isTeacher);
    const levelId = level === ALL ? undefined : (level as number);
    const { subjects } = useSubjects({ levelId, mine: isTeacher });

    const handleLevelChange = (v: typeof ALL | number) => {
        setLevel(v);
        setSubject(ALL);
    };

    // Students always see all types and split into sections.
    // Teachers/admins respect the type filter.
    const resolvedType: PostType | undefined =
        isStudent || type === ALL ? undefined : (type as PostType);

    const { posts: allPosts, loading } = usePosts(subject, resolvedType);
    const posts = allPosts.filter((p) => p.type !== "ANNOUNCEMENT");

    // Student sections — split after fetch
    const homeworkPosts    = posts.filter((p) => p.type === "HOMEWORK");
    const curriculumPosts  = posts.filter((p) => p.type === "CURRICULUM_POST");

    /* ── Student grades ──────────────────────────────────────────────────── */
    const [allGrades, setAllGrades] = useState<PartGrade[]>([]);
    useEffect(() => {
        if (!isStudent || !user) return;
        apiFetch<PartGrade[]>(endpoints.grades.forStudent(user.id))
            .then(setAllGrades)
            .catch(() => {});
    }, [isStudent, user?.id]);

    const visibleGrades = useMemo(() => {
        if (!isStudent) return [];
        if (subject === ALL) return allGrades;
        return allGrades.filter((g) => g.subject_id === (subject as number));
    }, [allGrades, subject, isStudent]);

    return (
        <>
            {/* Grade level filter — teachers and admins only */}
            {!isStudent && (
                <FilterBar
                    options={levels.map((l) => ({ value: l.id, label: l.grade_level }))}
                    value={level}
                    onChange={handleLevelChange}
                    allLabel="All grades"
                />
            )}

            {/* Subject filter — all roles */}
            <FilterBar
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                value={subject}
                onChange={setSubject}
            />

            {isStudent ? (
                /* ════════════════════════════════════════════════════════════
                   STUDENT VIEW — three separate sections
                ════════════════════════════════════════════════════════════ */
                <>
                    {/* ① Marks / Grades */}
                    <Card>
                        <SectionTitle icon="bi-award-fill" label="My Marks" />
                        <GradesPanel grades={visibleGrades} />
                    </Card>

                    {/* ② Homework */}
                    <Card>
                        <SectionTitle icon="bi-journal-check" label="Homework" />
                        <PostSection
                            posts={homeworkPosts}
                            loading={loading}
                            emptyLabel="No homework posted yet."
                        />
                    </Card>

                    {/* ③ Curriculum Resources */}
                    <Card>
                        <SectionTitle icon="bi-book-fill" label="Curriculum Resources" />
                        <PostSection
                            posts={curriculumPosts}
                            loading={loading}
                            emptyLabel="No curriculum resources for this selection."
                        />
                    </Card>
                </>
            ) : (
                /* ════════════════════════════════════════════════════════════
                   TEACHER / ADMIN VIEW — type filter + single section
                ════════════════════════════════════════════════════════════ */
                <Card>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                        <div className="d-flex gap-2 align-items-center">
                            <span className="text-muted small fw-semibold me-1">Type:</span>
                            <FilterBar
                                options={CURRICULUM_TYPES}
                                value={type}
                                onChange={setType}
                                allLabel="All"
                            />
                        </div>
                        {canPost && (
                            <button
                                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                                onClick={() => navigate("/add-post?type=CURRICULUM_POST")}
                            >
                                <i className="bi bi-book" />
                                New post
                            </button>
                        )}
                    </div>
                    <PostSection
                        title="Curriculum Resources"
                        posts={posts}
                        loading={loading}
                        emptyLabel="No resources for this selection."
                    />
                </Card>
            )}
        </>
    );
}
