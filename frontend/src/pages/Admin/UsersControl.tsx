import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import FilterBar from "@/components/Filters/FilterBar";
import ItemsTable from "@/components/Tables/ItemsTable";
import type { Column } from "@/components/Tables/ItemsTable";
import { useUsers } from "@/hooks/useUsers";
import { useFilter } from "@/hooks/useFilter";
import { useConversation } from "@/contexts/ConversationContext";
import SetMarkModal from "@/components/Grades/SetMarkModal";
import { ROLES } from "@/types/models.types";
import type { AnyUser, Role } from "@/types/models.types";

const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: r }));

interface MarkTarget {
    id: number;
    name: string;
}

export default function AdminUsersControl() {
    const [search, setSearch] = useState("");
    const { selected: role, setSelected: setRole } = useFilter<Role>();
    const { users, loading } = useUsers({ role, search });
    const navigate = useNavigate();
    const { openWithUser } = useConversation();
    const [markTarget, setMarkTarget] = useState<MarkTarget | null>(null);

    const COLUMNS: Column<AnyUser>[] = [
        { key: "name", header: "Name", accessor: (u) => `${u.first_name} ${u.last_name}` },
        {
            key: "role", header: "Role",
            render:   (u) => <span className="badge bg-secondary text-capitalize">{u.role}</span>,
            accessor: (u) => u.role,
        },
        { key: "phone",       header: "Phone",       accessor: (u) => u.phone ?? "—" },
        { key: "nationality", header: "Nationality", accessor: (u) => u.nationality ?? "—" },
        {
            key: "actions",
            header: "",
            render: (u) => (
                <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Set Mark — only meaningful for students */}
                    {u.role === "student" && (
                        <button
                            className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                            title="Set mark"
                            onClick={() => setMarkTarget({ id: u.id, name: `${u.first_name} ${u.last_name}` })}
                        >
                            <i className="bi bi-award" />
                            Set Mark
                        </button>
                    )}
                    <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                        title="Message"
                        onClick={() => openWithUser({ id: u.id, first_name: u.first_name, last_name: u.last_name })}
                    >
                        <i className="bi bi-chat-dots" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <FilterBar options={ROLE_OPTIONS} value={role} onChange={setRole} />
            <Card title="Manage Users">
                <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
                    <input
                        type="search"
                        className="form-control form-control-sm"
                        placeholder="Search users"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ maxWidth: "16rem" }}
                    />
                    <button
                        className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                        onClick={() => navigate("/add-user")}
                    >
                        <i className="bi bi-person-plus" />
                        Add user
                    </button>
                </div>
                <ItemsTable
                    columns={COLUMNS}
                    rows={users}
                    rowKey={(u) => u.id}
                    loading={loading}
                    searchable={false}
                    emptyLabel="No users found."
                    onRowClick={(u) => navigate(`/profile/${u.id}`)}
                />
            </Card>

            {markTarget && (
                <SetMarkModal
                    studentId={markTarget.id}
                    studentName={markTarget.name}
                    onClose={() => setMarkTarget(null)}
                />
            )}
        </>
    );
}
