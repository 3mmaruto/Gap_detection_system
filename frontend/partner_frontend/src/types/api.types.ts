/** Transport-level types: auth, pagination, query shapes. */
import type { AnyUser, ID, Role } from "./models.types";

export interface LoginRequest {
    /** Local MVP username. For students this can be the student name. */
    id: string;
    password: string;
}

export interface AuthTokens {
    access_token: string;
    token_type?: string;
}

export interface LoginResponse extends AuthTokens {
    user: AnyUser;
}

/** Standard envelope for list endpoints that page server-side. */
export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
}

export interface ListQuery {
    page?: number;
    page_size?: number;
    search?: string;
    subject_id?: ID;
    level_id?: ID;
    role?: Role;
    type?: string;
    mine?: boolean;
}

export interface ApiError {
    status: number;
    message: string;
    detail?: unknown;
}
