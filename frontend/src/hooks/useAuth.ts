import { createContext, useContext } from "react";
import type { LoginRequest } from "@/types/api.types";
import type { AnyUser } from "@/types/models.types";

export interface AuthState {
    user: AnyUser | null;
    loading: boolean;
    login: (credentials: LoginRequest) => Promise<AnyUser>;
    logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an <AuthProvider>");
    }
    return ctx;
}
