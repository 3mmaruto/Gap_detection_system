import type { ReactNode } from "react";

interface IconDropdownProps {
    icon: string;
    badge?: number;
    header: string;
    footerLabel: string;
    align?: "start" | "end";
    /** Stretch the menu to full viewport width, anchored below the header. */
    fullWidth?: boolean;
    onFooterClick?: () => void;
    children: ReactNode;
}

/** Shared bell/chat dropdown shell — badge, header, items, footer link. */
export default function IconDropdown({
    icon,
    badge = 0,
    header,
    footerLabel,
    align = "start",
    fullWidth = false,
    onFooterClick,
    children,
}: IconDropdownProps) {
    const menuClass = fullWidth
        ? "dropdown-menu dropdown-menu-fw"
        : `dropdown-menu${align === "end" ? " dropdown-menu-end" : ""}`;

    return (
        <div className="dropdown">
            <a
                className="nav-link"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                href="#"
                /* disable Popper when full-width so CSS positioning takes over */
                {...(fullWidth ? { "data-bs-display": "static" } : { "data-bs-offset": "9999,14" })}
                role="button"
            >
                <div className="position-relative d-inline-block">
                    <i className={`bi ${icon} fs-5`} />
                    {badge > 0 && (
                        <span className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle">
                            {badge}
                        </span>
                    )}
                </div>
            </a>
            <ul className={menuClass}>
                <li>
                    <h6 className="dropdown-header">{header}</h6>
                </li>
                {children}
                <li>
                    <hr className="dropdown-divider" />
                </li>
                <li>
                    <button
                        className="dropdown-item"
                        onClick={onFooterClick}
                    >
                        {footerLabel}
                    </button>
                </li>
            </ul>
        </div>
    );
}
