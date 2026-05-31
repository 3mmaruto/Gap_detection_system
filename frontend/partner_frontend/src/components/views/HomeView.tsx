import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import FilterBar from "@/components/Filters/FilterBar";
import ScheduleTable from "@/components/Tables/ScheduleTable";
import CurriculumProgress from "@/components/Progress/CurriculumProgress";
import ScheduleSlotModal from "@/components/Schedule/ScheduleSlotModal";
import SyllabusModal from "@/components/Schedule/SyllabusModal";
import { useAuth } from "@/hooks/useAuth";
import { useLevels } from "@/hooks/useLevels";
import { useSubjects } from "@/hooks/useSubjects";
import { useSchedule } from "@/hooks/useSchedule";
import { useProgress } from "@/hooks/useProgress";
import { ALL } from "@/hooks/useFilter";
import type { CellTarget } from "@/types/schedule.types";

export default function HomeView() {
    const { user } = useAuth();

    const isStudent = user?.role === "student";
    const isAdmin   = user?.role === "admin";
    const isTeacher = user?.role === "teacher";

    // ── Filters ──────────────────────────────────────────────────────────────
    const [selectedLevel, setSelectedLevel] = useState<number | typeof ALL>(ALL);
    const [selectedSubject, setSelectedSubject] = useState<number | typeof ALL>(ALL);

    // When level changes, reset subject
    const handleLevelChange = (v: number | typeof ALL) => {
        setSelectedLevel(v);
        setSelectedSubject(ALL);
    };

    // Grade levels: teacher sees only their own, admin sees all
    const { levels } = useLevels(isTeacher);

    // Subjects: filtered by selected level; teacher sees only their own
    const levelId = selectedLevel === ALL ? undefined : selectedLevel;
    const { subjects } = useSubjects({ levelId, mine: isTeacher });

    // Schedule: filtered by selected subject
    const subjectId = selectedSubject === ALL ? undefined : selectedSubject;
    const { schedule, loading: scheduleLoading, refetch } = useSchedule(subjectId);

    // ── Teacher clickable subject IDs ─────────────────────────────────────────
    const teacherSubjectIds = useMemo(() => {
        if (!isTeacher || !schedule?.entries) return undefined;
        return [...new Set(schedule.entries.map((e) => e.subject_id))];
    }, [isTeacher, schedule]);

    const { percent } = useProgress(isStudent ? user?.id : undefined);

    // ── Modal ─────────────────────────────────────────────────────────────────
    type ModalKind = "slot" | "syllabus" | null;
    const [modal, setModal] = useState<{ kind: ModalKind; target: CellTarget } | null>(null);

    const handleCellClick = (target: CellTarget) => {
        if (isAdmin) setModal({ kind: "slot", target });
        else if (isTeacher && target.entry) setModal({ kind: "syllabus", target });
    };

    const closeModal = () => setModal(null);
    const handleSaved = () => { refetch(); closeModal(); };

    // ── Derived labels ────────────────────────────────────────────────────────
    const levelOptions  = levels.map((l) => ({ value: l.id, label: `${l.grade_level} — ${l.curriculum_year}` }));
    const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

    return (
        <>
            {/* Grade level filter — shown for admin and teacher */}
            {(isAdmin || isTeacher) && (
                <div className="mb-1">
                    <p className="text-muted small mb-1 fw-semibold" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Grade level
                    </p>
                    <FilterBar
                        options={levelOptions}
                        value={selectedLevel}
                        onChange={handleLevelChange}
                        allLabel="All grades"
                    />
                </div>
            )}

            {/* Subject filter — shown for admin and teacher, gated on level selection */}
            {(isAdmin || isTeacher) && (
                <div className="mb-3">
                    <p className="text-muted small mb-1 fw-semibold" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Subject
                    </p>
                    <FilterBar
                        options={subjectOptions}
                        value={selectedSubject}
                        onChange={(v) => setSelectedSubject(v)}
                        allLabel="All subjects"
                    />
                </div>
            )}

            <Card title="Schedule">
                <ScheduleTable
                    schedule={schedule}
                    loading={scheduleLoading}
                    onCellClick={isAdmin || isTeacher ? handleCellClick : undefined}
                    teacherSubjectIds={isTeacher ? teacherSubjectIds : undefined}
                />
                {isStudent && (
                    <>
                        <h2 className="mt-3 mb-3">Progress</h2>
                        <CurriculumProgress value={percent} />
                    </>
                )}
            </Card>

            {modal?.kind === "slot" && (
                <ScheduleSlotModal
                    day={modal.target.day}
                    period={modal.target.period}
                    currentSubjectId={modal.target.entry?.subject_id}
                    currentSubjectName={modal.target.entry?.subject_name}
                    onClose={closeModal}
                    onSaved={handleSaved}
                />
            )}

            {modal?.kind === "syllabus" && modal.target.entry && (
                <SyllabusModal
                    scheduleItemId={modal.target.entry.schedule_item_id}
                    subjectName={modal.target.entry.subject_name}
                    day={modal.target.day}
                    period={modal.target.period}
                    onClose={closeModal}
                    onSaved={handleSaved}
                />
            )}
        </>
    );
}
