import { API_BASE_URL } from "./backend";
import type { ApiError, ListQuery } from "@/types/api.types";

/* ------------------------------------------------------------------ *
 * Token storage
 * ------------------------------------------------------------------ */

const TOKEN_KEY = "auth.access_token";

export const tokenStore = {
    get: (): string | null => localStorage.getItem(TOKEN_KEY),
    set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

/* ------------------------------------------------------------------ *
 * Core fetch wrapper
 * ------------------------------------------------------------------ */

export function isApiError(err: unknown): err is ApiError {
    return (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        "message" in err
    );
}

interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    /** Skip Authorization header (e.g. for the login call). */
    auth?: boolean;
    signal?: AbortSignal;
}

/**
 * Single chokepoint for every backend call. Injects the JWT, serializes
 * JSON, and normalizes failures into a typed {@link ApiError}.
 */
export async function apiFetch<T>(
    path: string,
    { method = "GET", body, auth = true, signal }: RequestOptions = {},
): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";

    if (auth) {
        const token = tokenStore.get();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        });
    } catch (cause) {
        const error: ApiError = {
            status: 0,
            message: "Network error — is the backend running?",
            detail: cause,
        };
        throw error;
    }

    if (!res.ok) {
        let detail: unknown;
        try {
            detail = await res.json();
        } catch {
            detail = await res.text().catch(() => undefined);
        }
        const error: ApiError = {
            status: res.status,
            message:
                res.status === 401
                    ? "Unauthorized"
                    : `Request failed (${res.status})`,
            detail,
        };
        throw error;
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}

/* ------------------------------------------------------------------ *
 * Endpoint map — versioned to match the NestJS controllers.
 * ------------------------------------------------------------------ */

function qs(query?: ListQuery): string {
    if (!query) return "";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    }
    const s = params.toString();
    return s ? `?${s}` : "";
}

export const endpoints = {
    auth: {
        login: "/auth/v1/login",
        logout: "/auth/v1/logout",
        me: "/auth/v1/me",
    },
    users: {
        list: (q?: ListQuery) => `/users/v1${qs(q)}`,
        byId: (id: number) => `/users/v1/${id}`,
        subjects: (id: number) => `/users/v1/${id}/subjects`,
        removeSubject: (id: number, subjectId: number, levelId: number) =>
            `/users/v1/${id}/subjects?subject_id=${subjectId}&level_id=${levelId}`,
    },
    students: {
        list: (q?: ListQuery) => `/students/v1${qs(q)}`,
        byId: (id: number) => `/students/v1/${id}`,
        history: (id: number) => `/students/v1/${id}/history`,
    },
    levels: {
        list: (mine?: boolean) => `/levels/v1${mine ? "?mine=true" : ""}`,
    },
    subjects: {
        list: (q?: ListQuery) => `/subjects/v1${qs(q)}`,
        byId: (id: number) => `/subjects/v1/${id}`,
    },
    schedule: {
        week: () => `/schedule/v1`,
        slot: () => `/schedule/v1/slot`,
        syllabus: (scheduleItemId: number) => `/schedule/v1/${scheduleItemId}/syllabus`,
    },
    posts: {
        list: (q?: ListQuery) => `/posts/v1${qs(q)}`,
        byId: (id: number) => `/posts/v1/${id}`,
    },
    progress: {
        forStudent: (studentId: number, subjectId?: number) =>
            `/students/v1/${studentId}/progress${
                subjectId ? `?subject_id=${subjectId}` : ""
            }`,
    },
    notifications: {
        list: "/notifications/v1",
        markSeen: (id: number) => `/notifications/v1/${id}/seen`,
        markAllSeen: "/notifications/v1/mark-all-seen",
    },
    conversations: {
        list: "/conversations/v1",
        messages: (id: number) => `/conversations/v1/${id}/messages`,
    },
    grades: {
        forStudent: (studentId: number) => `/grades/v1?student_id=${studentId}`,
        create: () => `/grades/v1`,
        update: (id: number) => `/grades/v1/${id}`,
        remove: (id: number) => `/grades/v1/${id}`,
    },
} as const;
