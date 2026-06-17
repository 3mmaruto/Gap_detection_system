import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/lib/routes";
import type { Role } from "@/types/models.types";

interface ProtectedRouteProps {
    allow: Role[];
    children: ReactNode;
}

/**
 * Gate for authenticated, role-restricted pages.
 * - not logged in  -> /login
 * - wrong role     -> that role's own home (no cross-role access)
 */
export default function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading…</span>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (!allow.includes(user.role)) {
        return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
    }

    return <>{children}</>;
}
