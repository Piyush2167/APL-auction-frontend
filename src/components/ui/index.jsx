"use client";
import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { Loader2, AlertTriangle, Inbox, RefreshCw } from "lucide-react";

export const cx = (...c) => c.filter(Boolean).join(" ");

const VARIANT = {
  primary: "bg-primary text-primary-fg hover:bg-primary/90",
  outline: "border border-ink/20 bg-surface hover:bg-surface-2",
  ghost: "hover:bg-surface-2",
  danger: "bg-danger text-white hover:bg-danger/90",
  success: "bg-success text-white hover:bg-success/90",
};
const SIZE = { sm: "h-8 px-3.5 text-sm", md: "h-10 px-5 text-sm", lg: "h-12 px-6 text-base", xl: "h-16 px-8 text-lg" };

export const Button = forwardRef(function Button({ variant = "outline", size = "md", pending = false, disabled, className, children, type = "button", ...rest }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || pending} aria-busy={pending || undefined}
      className={cx("inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,transform] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0", VARIANT[variant], SIZE[size], className)} {...rest}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function Card({ title, actions, className, bodyClassName, children }) {
  return (
    <section className={cx("flex min-w-0 flex-col rounded-2xl border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          {title && <h2 className="truncate text-lg">{title}</h2>}
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx("min-h-0 flex-1", bodyClassName ?? "p-4")}>{children}</div>
    </section>
  );
}

const TONES = {
  neutral: "bg-surface-2 text-muted border-line", primary: "bg-primary/15 text-accent border-primary/30",
  success: "bg-success/15 text-success border-success/30", danger: "bg-danger/15 text-danger border-danger/30",
  warning: "bg-warning/15 text-warning border-warning/30", info: "bg-info/15 text-info border-info/30",
  mystery: "bg-mystery/15 text-mystery border-mystery/30",
};
export function Badge({ tone = "neutral", className, children }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", TONES[tone], className)}>{children}</span>;
}

export const STATUS_TONE = {
  AVAILABLE: "neutral", ACTIVE: "info", FINALIZING: "warning", SOLD: "success", RESOLD: "success", UNSOLD: "danger",
  SKIPPED: "warning", RESALE_PENDING: "primary", RESALE_APPROVED: "info", LIVE: "success", PAUSED: "warning",
  CREATED: "neutral", READY: "info", COMPLETED: "neutral", CANCELLED: "danger", PENDING: "primary", APPROVED: "success", REJECTED: "danger",
};
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || "neutral"}>{String(status || "—").replace(/_/g, " ")}</Badge>;

export function Field({ label, error, hint, children, id: idProp }) {
  const auto = useId();
  const id = idProp || auto;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {typeof children === "function" ? children({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : hint ? `${id}-hint` : undefined }) : children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-xs text-danger">{error}</p>}
    </div>
  );
}

const inputCls = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm placeholder:text-muted/70 aria-[invalid=true]:border-danger disabled:opacity-60";
export const Input = forwardRef(function Input({ className, ...p }, ref) { return <input ref={ref} className={cx(inputCls, className)} {...p} />; });
export const Select = forwardRef(function Select({ className, children, ...p }, ref) { return <select ref={ref} className={cx(inputCls, className)} {...p}>{children}</select>; });
export const Textarea = forwardRef(function Textarea({ className, ...p }, ref) { return <textarea ref={ref} className={cx(inputCls, "h-auto min-h-20 py-2", className)} {...p} />; });

export const Spinner = ({ label = "Loading" }) => (
  <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted" role="status"><Loader2 className="size-4 animate-spin" aria-hidden />{label}…</div>
);

/** Skeleton that only appears after 200ms, so fast loads don't flash. */
export function Skeleton({ rows = 3, className }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 200); return () => clearTimeout(t); }, []);
  if (!show) return <div className={className} aria-busy="true" />;
  return (
    <div className={cx("flex flex-col gap-2", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-surface-2" />)}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <Icon className="size-8 text-muted" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center" role="alert">
      <AlertTriangle className="size-8 text-danger" aria-hidden />
      <p className="font-medium">Couldn&apos;t load this</p>
      <p className="max-w-sm text-sm text-muted">{error?.message || "Something went wrong."}</p>
      {onRetry && <Button size="sm" onClick={onRetry}><RefreshCw className="size-4" aria-hidden />Try again</Button>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className={cx("mt-1 font-display text-3xl tabular-nums", { success: "text-success", danger: "text-danger", primary: "text-accent", warning: "text-warning" }[tone])}>{value ?? "—"}</p>
      {hint && <p className="mt-1 truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Native <dialog> modal: focus trapping, Esc and backdrop come from the platform. */
export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose?.()}
      className={cx("m-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-ink/40", width)}>
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <header className="border-b border-line px-5 py-4"><h2 className="text-lg font-semibold">{title}</h2></header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, tone = "primary", pending, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<><Button onClick={onClose} disabled={pending}>Cancel</Button><Button variant={tone} pending={pending} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}

export function Table({ children, className }) {
  return <div className={cx("min-w-0 overflow-x-auto", className)}><table className="w-full border-collapse text-sm">{children}</table></div>;
}
export const Th = ({ children, num, className }) => <th scope="col" className={cx("whitespace-nowrap border-b border-line px-3 py-2 text-xs font-medium text-muted", num ? "text-right" : "text-left", className)}>{children}</th>;
export const Td = ({ children, num, className }) => <td className={cx("border-b border-line/60 px-3 py-2 align-middle", num && "text-right tabular-nums", className)}>{children}</td>;

export function Pagination({ page, limit, total, onPage }) {
  const pages = Math.max(Math.ceil(total / limit), 1);
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
      <span className="text-muted tabular-nums">Page {page} of {pages} · {total} total</span>
      <div className="flex gap-2">
        <Button size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </nav>
  );
}

export const points = (n) => (n == null ? "—" : `${Number(n).toLocaleString()} pts`);
export const dateTime = (d) => (d ? new Date(d).toLocaleString() : "—");
export const timeOnly = (d) => (d ? new Date(d).toLocaleTimeString() : "—");
