import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { PAGE_SIZE_OPTIONS, usePagination } from "@/hooks/usePagination";

export interface Column<T> {
    key: string;
    header: string;
    /** Custom cell renderer; falls back to `accessor`. */
    render?: (row: T) => ReactNode;
    /** Plain value for the default cell and for client-side search. */
    accessor?: (row: T) => string | number;
}

interface ItemsTableProps<T> {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => string | number;
    loading?: boolean;
    searchable?: boolean;
    emptyLabel?: string;
    onRowClick?: (row: T) => void;
}

export default function ItemsTable<T>({
    columns,
    rows,
    rowKey,
    loading = false,
    searchable = true,
    emptyLabel = "No records found.",
    onRowClick,
}: ItemsTableProps<T>) {
    const [query, setQuery] = useState("");
    const debounced = useDebounce(query).toLowerCase();

    const filtered = useMemo(() => {
        if (!debounced) return rows;
        const text = (row: T) =>
            columns
                .map((c) => (c.accessor ? c.accessor(row) : ""))
                .join(" ")
                .toLowerCase();
        return rows.filter((r) => text(r).includes(debounced));
    }, [rows, debounced, columns]);

    const {
        pageItems,
        page,
        pageCount,
        pageSize,
        setPage,
        setPageSize,
        rangeStart,
        rangeEnd,
        total,
        hasControls,
    } = usePagination(filtered);

    const renderCell = (col: Column<T>, row: T): ReactNode => {
        if (col.render) return col.render(row);
        if (col.accessor) return col.accessor(row);
        return null;
    };

    return (
        <>
            {(searchable || hasControls) && (
                <div className="row mb-3">
                    <div className="col-md-6 text-nowrap">
                        {hasControls && (
                            <div className="dropdown">
                                <label className="form-label text-muted">
                                    Show&nbsp;
                                </label>
                                <a
                                    className="btn border dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    href="#"
                                    role="button"
                                >
                                    {pageSize}
                                </a>
                                <ul className="dropdown-menu">
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <li key={size}>
                                            <button
                                                className="dropdown-item"
                                                type="button"
                                                onClick={() => setPageSize(size)}
                                            >
                                                {size}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    {searchable && (
                        <div className="col-md-6 d-flex justify-content-end">
                            <input
                                type="search"
                                className="form-control form-control-sm"
                                placeholder="Search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{ maxWidth: "16rem" }}
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="table-responsive">
                <table className={`table align-middle${onRowClick ? " table-hover" : ""}`}>
                    <thead>
                        <tr>
                            <th scope="col">#</th>
                            {columns.map((c) => (
                                <th scope="col" key={c.key}>
                                    {c.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="text-center text-muted py-4"
                                >
                                    Loading…
                                </td>
                            </tr>
                        ) : pageItems.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="text-center text-muted py-4"
                                >
                                    {emptyLabel}
                                </td>
                            </tr>
                        ) : (
                            pageItems.map((row, i) => (
                                <tr
                                    key={rowKey(row)}
                                    onClick={() => onRowClick?.(row)}
                                    style={onRowClick ? { cursor: "pointer" } : undefined}
                                >
                                    <th scope="row">{rangeStart + i}</th>
                                    {columns.map((c) => (
                                        <td key={c.key}>{renderCell(c, row)}</td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {hasControls && (
                <div className="row">
                    <div className="col">
                        <label className="form-label text-muted">
                            Showing {rangeStart} to {rangeEnd} of {total}
                        </label>
                    </div>
                    <nav className="col d-flex justify-content-end">
                        <ul className="pagination">
                            <li
                                className={`page-item ${
                                    page === 1 ? "disabled" : ""
                                }`}
                            >
                                <button
                                    className="page-link"
                                    type="button"
                                    aria-label="Previous"
                                    onClick={() => setPage(page - 1)}
                                >
                                    <span aria-hidden="true">&laquo;</span>
                                </button>
                            </li>
                            {Array.from(
                                { length: pageCount },
                                (_, i) => i + 1,
                            ).map((p) => (
                                <li
                                    key={p}
                                    className={`page-item ${
                                        p === page ? "active" : ""
                                    }`}
                                >
                                    <button
                                        className="page-link"
                                        type="button"
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                </li>
                            ))}
                            <li
                                className={`page-item ${
                                    page === pageCount ? "disabled" : ""
                                }`}
                            >
                                <button
                                    className="page-link"
                                    type="button"
                                    aria-label="Next"
                                    onClick={() => setPage(page + 1)}
                                >
                                    <span aria-hidden="true">&raquo;</span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </>
    );
}
