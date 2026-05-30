import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import FilterBar from "@/components/Filters/FilterBar";
import ItemsTable from "@/components/Tables/ItemsTable";
import type { Column } from "@/components/Tables/ItemsTable";
import { useUsers } from "@/hooks/useUsers";
import { useFilter } from "@/hooks/useFilter";
import { ROLES } from "@/types/models.types";
import type { AnyUser, Role } from "@/types/models.types";

const COLUMNS: Column<AnyUser>[] = [
    { key: "name",        header: "Name",        accessor: (u) => `${u.first_name} ${u.last_name}` },
    {
        key: "role", header: "Role",
        render:   (u) => <span className="badge bg-secondary text-capitalize">{u.role}</span>,
        accessor: (u) => u.role,
    },
    { key: "phone",       header: "Phone",       accessor: (u) => u.phone ?? "—" },
    { key: "nationality", header: "Nationality", accessor: (u) => u.nationality ?? "—" },
];

const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: r }));

export default function AdminUsersControl() {
    const [search, setSearch] = useState("");
    const { selected: role, setSelected: setRole } = useFilter<Role>();
    const { users, loading } = useUsers({ role, search });
    const navigate = useNavigate();

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
        </>
    );
}
