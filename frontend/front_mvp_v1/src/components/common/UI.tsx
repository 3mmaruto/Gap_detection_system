import type { BadgeTone } from "../../types";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

type MetricCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: BadgeTone;
};

export function Card({ children, className = "" }: CardProps) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function MetricCard({ label, value, detail, tone = "navy" }: MetricCardProps) {
  return (
    <Card className="metric-card">
      <span className={`metric-mark metric-${tone}`} />
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </Card>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-header">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state-mark" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
