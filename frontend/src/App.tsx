import { useEffect } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { APP_ROUTES, HOME_BY_ROLE } from "@/lib/routes";

import LoginPage from "@/pages/Common/Login";
import NotFound from "@/pages/Common/NotFound";

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function RootRedirect() {
    const { user, loading } = useAuth();
    if (loading) return null;
    return <Navigate to={user ? HOME_BY_ROLE[user.role] : "/login"} replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<LoginPage />} />

                {APP_ROUTES.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <ProtectedRoute allow={route.roles}>
                                <AppLayout>{route.element}</AppLayout>
                            </ProtectedRoute>
                        }
                    />
                ))}

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
