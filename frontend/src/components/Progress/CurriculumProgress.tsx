interface CurriculumProgressProps {
    /** Completion percentage, 0–100. */
    value: number;
}

export default function CurriculumProgress({ value }: CurriculumProgressProps) {
    const pct = Math.min(100, Math.max(0, Math.round(value)));
    return (
        <div
            className="position-relative rounded-pill overflow-hidden"
            style={{ height: "28px", backgroundColor: "#e0e7ff" }}
        >
            <div
                className="rounded-pill"
                role="progressbar"
                style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #6366f1, #4f46e5)",
                    transition: "width 0.4s ease",
                }}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
            />
            <span className="position-absolute top-50 start-50 translate-middle fw-semibold small"
                style={{ color: pct > 45 ? "#fff" : "#4338ca" }}
            >
                {pct}%
            </span>
        </div>
    );
}
