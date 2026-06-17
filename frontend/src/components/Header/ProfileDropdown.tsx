import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProfileDropdownProps {
    variant?: "menu" | "inline";
}

export default function ProfileDropdown({ variant = "menu" }: ProfileDropdownProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fullName = user ? `${user.first_name} ${user.last_name}` : "Account";
    const profileHref = user ? `/profile/${user.id}` : "#";

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const items = (
        <ul className="dropdown-menu">
            <li className="px-3 py-2 border-bottom mb-1">
                <div className="fw-semibold small" style={{ color: "#1e1b4b" }}>{fullName}</div>
                <div className="text-muted" style={{ fontSize: ".75rem", textTransform: "capitalize" }}>
                    {user?.role}
                </div>
            </li>
            <li>
                <Link className="dropdown-item" to={profileHref}>
                    <i className="bi bi-person me-2" />Profile
                </Link>
            </li>
            <li>
                <a className="dropdown-item" href="#">
                    <i className="bi bi-gear me-2" />Settings
                </a>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
                <button className="dropdown-item text-danger" type="button" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2" />Logout
                </button>
            </li>
        </ul>
    );

    if (variant === "inline") {
        return (
            <div className="dropup d-md-none">
                <hr />
                <a
                    className="d-flex align-items-center text-decoration-none dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    href="#"
                    role="button"
                >
                    <i className="bi bi-person-circle fs-5 me-2" />
                    <strong>{fullName}</strong>
                </a>
                {items}
            </div>
        );
    }

    return (
        <div className="dropdown d-none d-md-block">
            <a
                className="nav-link"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                href="#"
                data-bs-offset="9999,14"
                role="button"
            >
                <i className="bi bi-person-circle fs-5" />
            </a>
            {items}
        </div>
    );
}
