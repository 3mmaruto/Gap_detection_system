export default function NotFound() {
    return (
        <>
            <div>
                <div className="d-flex align-items-center justify-content-center min-vh-100 px-2">
                    <div className="text-center">
                        <h1 className="display-1 fw-bold">404</h1>
                        <p className="fs-2 fw-medium mt-4">
                            Oops! Page not found
                        </p>
                        <p className="mt-4 mb-5">
                            The page you're looking for doesn't exist or has
                            been moved.
                        </p>
                        <a
                            href="/"
                            className="btn btn-primary rounded-pill px-4 py-2"
                        >
                            Go Home
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
