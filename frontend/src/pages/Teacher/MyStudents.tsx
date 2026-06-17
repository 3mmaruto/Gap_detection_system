import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import ItemsTable from "@/components/Tables/ItemsTable";
import type { Column } from "@/components/Tables/ItemsTable";
import { useStudents } from "@/hooks/useUsers";
import { useConversation } from "@/contexts/ConversationContext";
import SetMarkModal from "@/components/Grades/SetMarkModal";
import type { Student } from "@/types/models.types";

interface MarkTarget {
    id: number;
    name: string;
}

export default function TeacherMyStudents() {
    const [search, setSearch] = useState("");
    const { students, loading } = useStudents(search);
    const navigate = useNavigate();
    const { openWithUser } = useConversation();
    const [markTarget, setMarkTarget] = useState<MarkTarget | null>(null);

    const COLUMNS: Column<Student>[] = [
        { key: "name",         header: "Name",        accessor: (s) => `${s.first_name} ${s.last_name}` },
        { key: "phone",        header: "Phone",        accessor: (s) => s.phone ?? "—" },
        { key: "parent_phone", header: "Parent phone", accessor: (s) => s.parent_phone ?? "—" },
        { key: "father_name",  header: "Father",       accessor: (s) => s.father_name ?? "—" },
        {
            key: "actions",
            header: "",
            render: (s) => (
                <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                        title="Set mark"
                        onClick={() => setMarkTarget({ id: s.id, name: `${s.first_name} ${s.last_name}` })}
                    >
                        <i className="bi bi-award" />
                        Set Mark
                    </button>
                    <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                        title="Message"
                        onClick={() => openWithUser({ id: s.id, first_name: s.first_name, last_name: s.last_name })}
                    >
                        <i className="bi bi-chat-dots" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
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
