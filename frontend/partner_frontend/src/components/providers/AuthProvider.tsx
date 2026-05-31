import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch, endpoints, tokenStore } from "@/lib/api";
import { AuthContext } from "@/hooks/useAuth";
import type { LoginRequest, LoginResponse } from "@/types/api.types";
import type { AnyUser } from "@/types/models.types";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AnyUser | null>(null);
    // Only "loading" a session when there's a token to validate.
    const [loading, setLoading] = useState<boolean>(
        () => tokenStore.get() !== null,
    );

    // Rehydrate the session from a stored token on first mount.
    useEffect(() => {
        const token = tokenStore.get();
        if (!token) return;
        let cancelled = false;
        apiFetch<AnyUser>(endpoints.auth.me)
            .then((me) => {
                if (!cancelled) setUser(me);
            })
            .catch(() => {
                tokenStore.clear();
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (credentials: LoginRequest) => {
        const res = await apiFetch<LoginResponse>(endpoints.auth.login, {
            method: "POST",
            body: credentials,
            auth: false,
        });
        tokenStore.set(res.access_token);
        setUser(res.user);
        return res.user;
    }, []);

    const logout = useCallback(() => {
        tokenStore.clear();
        setUser(null);
        // Fire-and-forget; the client is already logged out locally.
        apiFetch(endpoints.auth.logout, { method: "POST" }).catch(() => {});
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
