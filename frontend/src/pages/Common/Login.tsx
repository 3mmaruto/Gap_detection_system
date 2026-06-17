import LoginForm from "@/components/Login/LoginForm";

export default function LoginPage() {
    return (
        <main>
            <div
                className="container-fluid p-0"
                style={{
                    minHeight: "100dvh",
                    backgroundColor: "#1e1b4b",
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=60')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundBlendMode: "multiply",
                }}
            >
                <div
                    className="row g-0 align-items-center"
                    style={{ minHeight: "100dvh" }}
                >
                    <div className="col-md-7 d-none d-md-block" />

                    <div className="col-12 col-md-5 p-4">
                        <div className="sms-login-card w-100 d-flex flex-column justify-content-center">
                            <a
                                href="/"
                                className="d-flex text-decoration-none align-items-center p-3 pb-0"
                                style={{ color: "#4338ca" }}
                            >
                                <i className="bi bi-mortarboard-fill me-2 fs-5" />
                                <span className="fs-5 fw-bold">
                                    مدرسة شبعرفني للتعليم الأساسي
                                </span>
                            </a>
                            <div className="p-4">
                                <h3 className="mb-1 fw-bold" style={{ color: "#1e1b4b" }}>
                                    Welcome back
                                </h3>
                                <p className="text-muted mb-4" style={{ fontSize: ".9rem" }}>
                                    Sign in with your ID number and password
                                </p>
                                <LoginForm />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
