import type { ReactNode } from "react";
import { cx } from "./cx";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  const hasError = error !== undefined && error !== "";

  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-1 text-ember">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {hint === undefined ? null : <p className="text-xs leading-relaxed text-ink-faint">{hint}</p>}
      {children}
      {hasError && (
        <p role="alert" className="text-xs leading-relaxed text-ember-ink">
          {error}
        </p>
      )}
    </div>
  );
}
