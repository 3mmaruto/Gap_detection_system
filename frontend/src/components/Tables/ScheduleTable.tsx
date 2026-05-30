import { useMemo } from "react";
import { CLASS_PERIODS, DAYS_SHORT } from "@/lib/school";
import type { WeekSchedule, ScheduleEntry, WeekdayShort, ClassPeriod } from "@/types/schedule.types";

interface CellTarget {
    day: WeekdayShort;
    period: ClassPeriod;
    entry: ScheduleEntry | undefined;
}

interface ScheduleTableProps {
    schedule: WeekSchedule | null;
    loading?: boolean;
    onPrevWeek?: () => void;
    onNextWeek?: () => void;
    /** Called when a cell is clicked. Admin: any cell. Teacher: only cells with their subject. */
    onCellClick?: (target: CellTarget) => void;
    /** IDs of subjects the viewer teaches (teacher-only). Limits clickable cells. */
    teacherSubjectIds?: number[];
}

function indexEntries(entries: ScheduleEntry[]) {
    const map = new Map<string, ScheduleEntry>();
    for (const e of entries) map.set(`${e.day}|${e.period}`, e);
    return map;
}

export default function ScheduleTable({
    schedule,
    loading = false,
    onPrevWeek,
    onNextWeek,
    onCellClick,
    teacherSubjectIds,
}: ScheduleTableProps) {
    const cells = useMemo(
        () => indexEntries(Array.isArray(schedule?.entries) ? schedule!.entries : []),
        [schedule],
    );

    const isCellClickable = (entry: ScheduleEntry | undefined): boolean => {
        if (!onCellClick) return false;
        // Admin (no teacherSubjectIds restriction): all cells clickable
        if (!teacherSubjectIds) return true;
        // Teacher: only cells where their subject is assigned
        return !!entry && teacherSubjectIds.includes(entry.subject_id);
    };

    return (
        <div className="border rounded-3 overflow-hidden" style={{ borderColor: "#dde3f0" }}>
            {/* Header row */}
            <div
                className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom"
                style={{ background: "#f5f7fe", borderColor: "#dde3f0" }}
            >
                <i
                    className="bi bi-caret-left-fill text-muted"
                    style={{ cursor: "pointer" }}
                    onClick={onPrevWeek}
                />
                <span className="fw-bold" style={{ color: "#1e1b4b" }}>
                    {schedule?.range_label ?? "—"}
                </span>
                <i
                    className="bi bi-caret-right-fill text-muted"
                    style={{ cursor: "pointer" }}
                    onClick={onNextWeek}
                />
            </div>

            <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                    <thead>
                        <tr style={{ background: "#f5f7fe" }}>
                            <th scope="col" style={{ width: "80px" }} />
                            {DAYS_SHORT.map((d) => (
                                <th
                                    key={d}
                                    scope="col"
                                    className="text-center text-muted small fw-medium"
                                >
                                    {d}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={DAYS_SHORT.length + 1} className="text-center text-muted py-4">
                                    Loading…
                                </td>
                            </tr>
                        ) : (
                            CLASS_PERIODS.map((period) => (
                                <tr key={period}>
                                    <td
                                        className="text-muted small fw-semibold"
                                        style={{ background: "#f5f7fe" }}
                                    >
                                        CLASS {period}
                                    </td>
                                    {DAYS_SHORT.map((day) => {
                                        const entry = cells.get(`${day}|${period}`);
                                        const clickable = isCellClickable(entry);

                                        return (
                                            <td
                                                key={day}
                                                onClick={
                                                    clickable
                                                        ? () => onCellClick?.({ day, period, entry })
                                                        : undefined
                                                }
                                                style={{
                                                    cursor: clickable ? "pointer" : "default",
                                                    background: clickable && !entry
                                                        ? "rgba(99,102,241,.03)"
                                                        : undefined,
                                                    transition: "background .1s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!clickable) return;
                                                    (e.currentTarget as HTMLTableCellElement).style.background =
                                                        entry ? "rgba(99,102,241,.08)" : "rgba(99,102,241,.07)";
                                                    const hint = (e.currentTarget as HTMLTableCellElement).querySelector<HTMLElement>(".schedule-cell-hint");
                                                    if (hint) hint.style.opacity = "1";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!clickable) return;
                                                    (e.currentTarget as HTMLTableCellElement).style.background =
                                                        entry ? "" : "rgba(99,102,241,.03)";
                                                    const hint = (e.currentTarget as HTMLTableCellElement).querySelector<HTMLElement>(".schedule-cell-hint");
                                                    if (hint) hint.style.opacity = "0";
                                                }}
                                            >
                                                {entry ? (
                                                    <div className="d-flex flex-column gap-1">
                                                        <span className="badge bg-primary align-self-start">
                                                            {entry.subject_name}
                                                        </span>
                                                        <div className="d-flex justify-content-between align-items-baseline gap-2">
                                                            <small className="fw-medium">
                                                                {entry.topic_title}
                                                            </small>
                                                            {entry.reference && (
                                                                <small className="text-muted">
                                                                    {entry.reference}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : clickable ? (
                                                    <span
                                                        className="schedule-cell-hint text-muted"
                                                        style={{ fontSize: "0.7rem", opacity: 0, transition: "opacity .15s" }}
                                                    >
                                                        + assign
                                                    </span>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
