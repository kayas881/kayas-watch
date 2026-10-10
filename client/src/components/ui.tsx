import { AlertCircle, Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone = "primary" | "secondary" | "danger" | "quiet";

export function Button({ tone = "primary", className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return <button className={`button button-${tone} ${className}`} {...props}>{children}</button>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return <div className="page-header">
    <div>
      <p className="eyebrow">Saral Watch</p>
      <h1>{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
    </div>
    {action && <div className="page-actions">{action}</div>}
  </div>;
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const tone = normalized === "UP" || normalized === "ACTIVE"
    ? "success"
    : normalized === "DEGRADED"
      ? "warning"
      : normalized === "PAUSED" || normalized === "UNKNOWN" || normalized === "VIEWER"
        ? "neutral"
        : normalized === "ADMIN"
          ? "info"
          : normalized === "SUPERADMIN"
            ? "primary"
            : "danger";
  const label = normalized === "SUPERADMIN" ? "Super Admin" : normalized[0] + normalized.slice(1).toLowerCase();
  return <span className={`status-badge status-${tone}`}><span aria-hidden="true" className="status-dot" />{label}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function TableShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`table-shell ${className}`}><div className="table-scroll">{children}</div></div>;
}

export function ErrorBox({ text }: { text: string }) {
  return text ? <div className="feedback feedback-error" role="alert"><AlertCircle className="w-4 h-4 shrink-0" />{text}</div> : null;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return <div className="loading-state" role="status"><Loader2 className="w-6 h-6 animate-spin" /><span>{label}…</span></div>;
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action && <div className="empty-action">{action}</div>}</div>;
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="dialog-panel" role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}>
      <div className="dialog-heading"><h2>{title}</h2><button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}>×</button></div>
      {children}
    </section>
  </div>;
}
