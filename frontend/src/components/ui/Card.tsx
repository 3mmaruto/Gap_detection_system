import type { ReactNode } from "react";

interface CardProps {
    title?: string;
    children: ReactNode;
    className?: string;
}

/** The repeated `bg-white border ... rounded` panel used across pages. */
export default function Card({ title, children, className = "" }: CardProps) {
    return (
        <div className={`bg-white border p-2 p-md-4 rounded mb-3 ${className}`}
            style={{ borderColor: "#dde3f0", borderRadius: "0.75rem", boxShadow: "0 1px 4px rgba(0,0,0,.05), 0 6px 18px rgba(99,102,241,.05)" }}
        >
            {title && <h2 className="mb-3" style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1e293b" }}>{title}</h2>}
            {children}
        </div>
    );
}
