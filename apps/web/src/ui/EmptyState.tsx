import type { ReactNode } from "react";
import { cx } from "./cx";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-line-strong bg-surface px-8 py-16 text-center",
        className,
      )}
    >
      {icon === undefined ? null : (
        <span
          aria-hidden="true"
          className="inline-flex size-14 items-center justify-center rounded-2xl bg-sunken text-ink-muted"
        >
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-2">
        <p className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">{title}</p>
        {description === undefined ? null : (
          <p className="mx-auto max-w-[46ch] text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action === undefined ? null : (
        <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>
      )}
    </div>
  );
}
