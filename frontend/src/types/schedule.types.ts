/** View-model types for the weekly schedule grid (derived from ScheduleItem + Topic). */
import type { DAYS_SHORT, CLASS_PERIODS } from "@/lib/school";
import type { ID } from "./models.types";

export type WeekdayShort = (typeof DAYS_SHORT)[number];
export type ClassPeriod = (typeof CLASS_PERIODS)[number];

/** A single rendered cell in the schedule grid. */
export interface ScheduleEntry {
    schedule_item_id: ID;
    subject_id: ID;
    subject_name: string;
    /** Current topic/lesson title for this slot. */
    topic_title: string;
    /** Short reference shown on the right of the cell, e.g. "ch.7". */
    reference?: string;
    day: WeekdayShort;
    period: ClassPeriod;
}

export interface WeekSchedule {
    /** Inclusive range label, e.g. "Jan 13 – Jan 20, 2026". */
    range_label: string;
    week_start: string;
    entries: ScheduleEntry[];
}

export interface CellTarget {
    day: WeekdayShort;
    period: ClassPeriod;
    entry: ScheduleEntry | undefined;
}
