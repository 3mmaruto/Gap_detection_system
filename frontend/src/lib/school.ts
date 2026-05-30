/** Static school / schedule constants and shared types. */

export const DAYS_FULL = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;

export const DAYS_SHORT = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
] as const;

export const CLASS_PERIODS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Shape used by Header's nav link list. */
export interface NavLink {
    name: string;
    href: string;
}
