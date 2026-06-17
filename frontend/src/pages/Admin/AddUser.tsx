import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, endpoints, isApiError } from "@/lib/api";
import { ROLES } from "@/types/models.types";
import type { AnyUser, Role } from "@/types/models.types";

const ROLE_ICONS: Record<Role, string> = {
    admin: "bi-shield-lock",
    teacher: "bi-person-workspace",
    student: "bi-mortarboard",
};

const ROLE_COLORS: Record<Role, string> = {
    admin: "#ef4444",
    teacher: "#6366f1",
    student: "#10b981",
};

export default function AddUserPage() {
    const navigate = useNavigate();

    const [role, setRole] = useState<Role>("student");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [nationality, setNationality] = useState("");
    const [birthDate, setBirthDate] = useState("");

    // Student-only fields
    const [parentPhone, setParentPhone] = useState("");
    const [fatherName, setFatherName] = useState("");
    const [motherName, setMotherName] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const body: Record<string, unknown> = {
                first_name: firstName,
                last_name: lastName,
                password,
                role,
                phone: phone || undefined,
                gender: gender || undefined,
                nationality: nationality || undefined,
                brith_date: birthDate || undefined,
            };
            if (role === "student") {
                body.parent_phone = parentPhone || undefined;
                body.father_name = fatherName || undefined;
                body.mother_name = motherName || undefined;
            }
            const created = await apiFetch<AnyUser>(endpoints.users.list(), {
                method: "POST",
                body,
            });
            navigate(`/profile/${created.id}`, { replace: true });
        } catch (err) {
            setError(isApiError(err) ? err.message : "Failed to create user.");
        } finally {
            setSubmitting(false);
        }
    };

    const accent = ROLE_COLORS[role];

    return (
        <div className="container py-4" style={{ maxWidth: 620 }}>
            {/* Header */}
            <div className="mb-4">
                <h2 className="fw-bold mb-1">Add new user</h2>
                <p className="text-muted small mb-0">
                    Create an account for a student, teacher, or admin.
                </p>
            </div>

            <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
                {error && (
                    <div className="alert alert-danger py-2 mb-0" role="alert">
                        {error}
                    </div>
                )}

                {/* Role picker */}
                <div>
                    <label className="form-label fw-semibold">Role</label>
                    <div className="d-flex gap-2">
                        {ROLES.map((r) => {
                            const active = role === r;
                            return (
                                <button
                                    key={r}
                                    type="button"
                                    className="btn btn-sm d-flex align-items-center gap-1 px-3"
                                    style={{
                                        background: active ? ROLE_COLORS[r] + "18" : "#f5f7fe",
                                        border: `1.5px solid ${active ? ROLE_COLORS[r] : "#dde3f0"}`,
                                        color: active ? ROLE_COLORS[r] : "#64748b",
                                        fontWeight: active ? 600 : 400,
                                        transition: "all .15s",
                                    }}
                                    onClick={() => setRole(r)}
                                >
                                    <i className={`bi ${ROLE_ICONS[r]}`} />
                                    <span className="text-capitalize">{r}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <hr className="my-0" style={{ borderColor: "#dde3f0" }} />

                {/* Name row */}
                <div className="row g-3">
                    <div className="col-6">
                        <div className="form-floating">
                            <input
                                id="first-name"
                                type="text"
                                className="form-control"
                                placeholder="First name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                            <label htmlFor="first-name">First name</label>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="form-floating">
                            <input
                                id="last-name"
                                type="text"
                                className="form-control"
                                placeholder="Last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                            <label htmlFor="last-name">Last name</label>
                        </div>
                    </div>
                </div>

                {/* Password */}
                <div className="form-floating">
                    <input
                        id="password"
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                    />
                    <label htmlFor="password">Password</label>
                </div>

                {/* Phone + Gender row */}
                <div className="row g-3">
                    <div className="col-6">
                        <div className="form-floating">
                            <input
                                id="phone"
                                type="tel"
                                className="form-control"
                                placeholder="Phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                            <label htmlFor="phone">Phone (optional)</label>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="form-floating">
                            <select
                                id="gender"
                                className="form-select"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                            >
                                <option value="">— Select —</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                            <label htmlFor="gender">Gender (optional)</label>
                        </div>
                    </div>
                </div>

                {/* Nationality + Birth date row */}
                <div className="row g-3">
                    <div className="col-6">
                        <div className="form-floating">
                            <input
                                id="nationality"
                                type="text"
                                className="form-control"
                                placeholder="Nationality"
                                value={nationality}
                                onChange={(e) => setNationality(e.target.value)}
                            />
                            <label htmlFor="nationality">Nationality (optional)</label>
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="form-floating">
                            <input
                                id="birth-date"
                                type="date"
                                className="form-control"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                            <label htmlFor="birth-date">Birth date (optional)</label>
                        </div>
                    </div>
                </div>

                {/* Student-only fields */}
                {role === "student" && (
                    <>
                        <div
                            className="rounded-3 p-3 d-flex flex-column gap-3"
                            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                        >
                            <p className="mb-0 small fw-semibold" style={{ color: "#15803d" }}>
                                <i className="bi bi-person-lines-fill me-2" />
                                Student details
                            </p>

                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="form-floating">
                                        <input
                                            id="father-name"
                                            type="text"
                                            className="form-control"
                                            placeholder="Father's name"
                                            value={fatherName}
                                            onChange={(e) => setFatherName(e.target.value)}
                                        />
                                        <label htmlFor="father-name">Father's name</label>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="form-floating">
                                        <input
                                            id="mother-name"
                                            type="text"
                                            className="form-control"
                                            placeholder="Mother's name"
                                            value={motherName}
                                            onChange={(e) => setMotherName(e.target.value)}
                                        />
                                        <label htmlFor="mother-name">Mother's name</label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-floating">
                                <input
                                    id="parent-phone"
                                    type="tel"
                                    className="form-control"
                                    placeholder="Parent phone"
                                    value={parentPhone}
                                    onChange={(e) => setParentPhone(e.target.value)}
                                />
                                <label htmlFor="parent-phone">Parent phone (optional)</label>
                            </div>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="d-flex gap-2 justify-content-end pt-1">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(-1)}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn"
                        style={{ background: accent, color: "#fff", borderColor: accent }}
                        disabled={submitting || !firstName || !lastName || !password}
                    >
                        {submitting ? "Creating…" : `Create ${role}`}
                        &nbsp;
                        <i className={`bi ${ROLE_ICONS[role]}`} />
                    </button>
                </div>
            </form>
        </div>
    );
}
