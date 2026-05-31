import type { ReactNode } from "react";
import Header from "@/components/Header/Header";
import { useAuth } from "@/hooks/useAuth";
import { NAVLINKS_BY_ROLE } from "@/lib/routes";

export default function AppLayout({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const navLinks = user ? NAVLINKS_BY_ROLE[user.role] : [];

    return (
        <>
            <Header navLinks={navLinks} />
            <main className="container-fluid p-md-5">{children}</main>
        </>
    );
}
