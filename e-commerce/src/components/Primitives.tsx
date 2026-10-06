import { useEffect, useId, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckIcon, ChevronLeft, ChevronRight, CloseIcon, StarIcon } from "./Icons";

// ── Buttons ────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-ink font-semibold hover:bg-accent-hover active:bg-accent-hover disabled:bg-accent/40",
  secondary:
    "bg-surface-2 text-fg border border-line hover:border-line-strong hover:bg-surface-3",
  ghost: "text-fg-2 hover:text-fg hover:bg-surface-2",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`inline-flex items-center justify-center rounded-xl transition-colors duration-150 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

// ── Surfaces ───────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  as: _as,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface ${className}`}>{children}</div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-3 text-fg-2 border-line",
    accent: "bg-accent/15 text-accent border-accent/25",
    success: "bg-success/15 text-success border-success/25",
    warning: "bg-warning/15 text-warning border-warning/25",
    danger: "bg-danger/15 text-danger border-danger/25",
    info: "bg-info/15 text-info border-info/25",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ── Rating ─────────────────────────────────────────────────────────────────

export function Rating({
  value,
  count,
  size = 14,
  showValue = true,
  className = "",
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon
            key={i}
            size={size}
            filled={i <= Math.round(value)}
            className={i <= Math.round(value) ? "text-warning" : "text-line-strong"}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-sm font-medium text-fg tabular-nums">{value.toFixed(1)}</span>
      )}
      {count !== undefined && <span className="text-sm text-fg-3">({count.toLocaleString()})</span>}
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5{count !== undefined ? ` from ${count} reviews` : ""}
      </span>
    </span>
  );
}

// ── Quantity stepper ───────────────────────────────────────────────────────

export function QtyStepper({
  value,
  onChange,
  max = 99,
  min = 0,
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
}) {
  const btn =
    size === "sm"
      ? "h-7 w-7"
      : "h-9 w-9";
  const box = size === "sm" ? "h-7 w-9 text-sm" : "h-9 w-11 text-sm";

  return (
    <div className="inline-flex items-center rounded-lg border border-line bg-surface-2">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`${btn} grid place-items-center rounded-l-lg text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg disabled:opacity-35 disabled:hover:bg-transparent`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <span className={`${box} grid place-items-center font-medium tabular-nums`}>{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`${btn} grid place-items-center rounded-r-lg text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg disabled:opacity-35 disabled:hover:bg-transparent`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Prevent the page behind the modal from scrolling.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl outline-none sm:rounded-2xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-fg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-line bg-surface-2 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Window of page numbers around the current page, with ellipses at the ends.
  const window: (number | "gap")[] = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);
  if (start > 1) window.push(1, "gap");
  for (let i = start; i <= end; i++) window.push(i);
  if (end < totalPages) window.push("gap", totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg disabled:opacity-35 disabled:hover:bg-transparent"
      >
        <ChevronLeft size={16} />
      </button>

      {window.map((entry, i) =>
        entry === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-fg-3">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={`h-9 min-w-9 rounded-lg border px-2.5 text-sm font-medium transition-colors ${
              entry === page
                ? "border-accent bg-accent text-ink"
                : "border-line text-fg-2 hover:bg-surface-3 hover:text-fg"
            }`}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-fg-2 transition-colors hover:bg-surface-3 hover:text-fg disabled:opacity-35 disabled:hover:bg-transparent"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

// ── Feedback ───────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-3 ${className}`} />;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-surface-3 text-fg-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-fg-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/10 px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-fg">Something went wrong</h3>
      <p className="mt-1.5 text-sm text-fg-2">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ── Form fields ────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1 text-sm font-medium text-fg-2">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-fg-3">{hint}</p>
      )}
    </div>
  );
}

export function inputClass(invalid?: boolean): string {
  return `h-11 w-full rounded-xl border bg-surface-2 px-3.5 text-sm text-fg placeholder:text-fg-3 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 ${
    invalid ? "border-danger" : "border-line focus:border-accent"
  }`;
}

// ── Select ─────────────────────────────────────────────────────────────────

export function Select({
  value,
  onChange,
  children,
  className = "",
  id,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  id?: string;
  label?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg-2">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface-2 bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat px-3.5 pr-9 text-sm text-fg transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a0b8' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m5 9 7 7 7-7'/%3E%3C/svg%3E\")",
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ── Checkbox ───────────────────────────────────────────────────────────────

export function Checkbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 py-1">
      <span
        className={`grid h-4.5 w-4.5 shrink-0 place-items-center rounded border transition-colors ${
          checked ? "border-accent bg-accent text-ink" : "border-line-strong bg-surface-2 group-hover:border-fg-3"
        }`}
        style={{ width: 18, height: 18 }}
      >
        {checked && <CheckIcon size={12} />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="flex-1 text-sm text-fg-2 group-hover:text-fg">{label}</span>
      {count !== undefined && <span className="text-xs text-fg-3 tabular-nums">{count}</span>}
    </label>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-surface-3 border border-line"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── Breadcrumbs ────────────────────────────────────────────────────────────

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-fg-3">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={13} className="text-fg-3/60" />}
          {item.to ? (
            <Link to={item.to} className="transition-colors hover:text-fg">
              {item.label}
            </Link>
          ) : (
            <span className="text-fg-2">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}