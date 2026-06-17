import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { HOME_BY_ROLE } from "@/lib/routes";
import { isApiError } from "@/lib/api";

export default function LoginForm() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const user = await login({ id, password });
            navigate(HOME_BY_ROLE[user.role], { replace: true });
        } catch (err: unknown) {
            setError(
                isApiError(err) && err.status === 401
                    ? "Incorrect ID or password."
                    : "Could not sign in. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="form-signin form-control-sm p-0">
            <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
                {error && (
                    <div className="alert alert-danger py-2 mb-0" role="alert">
                        {error}
                    </div>
                )}
                <div className="form-floating">
                    <input
                        id="login-id"
                        type="text"
                        className="form-control"
                        placeholder="id..."
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        autoComplete="username"
                        required
                    />
                    <label htmlFor="login-id">ID number</label>
                </div>
                <div className="form-floating">
                    <input
                        id="login-password"
                        type="password"
                        className="form-control"
                        placeholder="password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                    <label htmlFor="login-password">Password</label>
                </div>
                <button
                    className="align-self-end btn btn-primary"
                    type="submit"
                    disabled={submitting || !id || !password}
                >
                    {submitting ? "Signing in…" : "Sign in"}
                    &nbsp;
                    <i className="bi bi-person" />
                </button>
            </form>
        </div>
    );
}
