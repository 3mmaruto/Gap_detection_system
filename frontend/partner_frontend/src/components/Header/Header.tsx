import { NavLink } from "react-router-dom";
import type { NavLink as NavLinkItem } from "@/lib/school";
import MessagesDropdown from "./MessagesDropdown";
import NotificationsDropdown from "./NotificationsDropdown";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/models.types";

const ROLE_CLASS: Record<Role, string> = {
    student: "sms-header--student",
    teacher: "sms-header--teacher",
    admin: "sms-header--admin",
};

interface HeaderProps {
    navLinks: NavLinkItem[];
}

export default function Header({ navLinks }: HeaderProps) {
    const { user } = useAuth();
    const roleClass = user ? ROLE_CLASS[user.role] : "";

    return (
        <header className={`sms-header py-1 fixed-top ${roleClass}`}>
            <div className="container-fluid d-flex">
                <nav className="navbar navbar-expand-md me-auto">
                    <a
                        className="navbar-toggler"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#navbarOffcanvas"
                        aria-controls="navbarOffcanvas"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                        href="#"
                        role="button"
                    >
                        <span className="bi bi-list"></span>
                    </a>
                    <div
                        className="offcanvas offcanvas-start offcanvas-md"
                        id="navbarOffcanvas"
                        tabIndex={-1}
                        aria-labelledby="navbarOffcanvasLabel"
                    >
                        <div className="offcanvas-body d-flex flex-column justify-content-between p-4 p-md-0">
                            <div>
                                <ul className="navbar-nav">
                                    {navLinks.map((link) => (
                                        <li
                                            className="nav-item"
                                            key={link.name}
                                        >
                                            <NavLink
                                                className="nav-link"
                                                to={link.href}
                                            >
                                                {link.name}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <ProfileDropdown variant="inline" />
                        </div>
                    </div>
                </nav>

                <div className="d-flex align-items-center">
                    <NotificationsDropdown />
                    <MessagesDropdown />
                    <ProfileDropdown />
                </div>
            </div>
        </header>
    );
}
