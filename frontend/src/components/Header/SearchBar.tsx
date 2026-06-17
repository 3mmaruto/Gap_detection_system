import { useState } from "react";

interface SearchBarProps {
    className?: string;
    onSearch?: (query: string) => void;
}

/** The search input duplicated in the mobile offcanvas and desktop bar. */
export default function SearchBar({ className = "", onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");

    return (
        <div className={className}>
            <div className="position-relative">
                <input
                    className="form-control bg-light pe-5"
                    type="text"
                    placeholder="Search for ..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSearch?.(query);
                    }}
                />
                <button
                    className="btn btn-primary position-absolute end-0 top-0 h-100"
                    type="button"
                    onClick={() => onSearch?.(query)}
                >
                    <i className="bi bi-search"></i>
                </button>
            </div>
        </div>
    );
}
