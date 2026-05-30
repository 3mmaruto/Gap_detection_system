import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import ItemsTable from "@/components/Tables/ItemsTable";
import type { Column } from "@/components/Tables/ItemsTable";
import { useStudents } from "@/hooks/useUsers";
import type { Student } from "@/types/models.types";

const COLUMNS: Column<Student>[] = [
    { key: "name",         header: "Name",         accessor: (s) => `${s.first_name} ${s.last_name}` },
    { key: "phone",        header: "Phone",         accessor: (s) => s.phone ?? "—" },
    { key: "parent_phone", header: "Parent phone",  accessor: (s) => s.parent_phone ?? "—" },
    { key: "father_name",  header: "Father",        accessor: (s) => s.father_name ?? "—" },
];

export default function TeacherMyStudents() {
    const [search, setSearch] = useState("");
    const { students, loading } = useStudents(search);
    const navigate = useNavigate();

    return (
        <Card title="My Students">
            <div className="mb-3">
                <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search students"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: "16rem" }}
                />
            </div>
            <ItemsTable
                columns={COLUMNS}
                rows={students}
                rowKey={(s) => s.id}
                loading={loading}
                searchable={false}
                emptyLabel="No students assigned yet."
                onRowClick={(s) => navigate(`/profile/${s.id}`)}
            />
        </Card>
    );
}
