import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "./cx";

export interface SwitchProps extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  label: ReactNode;
  description?: string | undefined;
  labelClassName?: string | undefined;
  containerClassName?: string | undefined;
}

export function Switch({
  label,
  description,
  className,
  labelClassName,
  containerClassName,
  ...rest
}: SwitchProps) {
  return (
    <label
      className={cx(
        "flex cursor-pointer select-none items-center justify-between gap-5",
        containerClassName,
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cx("text-sm font-medium leading-snug text-ink", labelClassName)}>
          {label}
        </span>
        {description === undefined ? null : (
          <span className="text-xs leading-relaxed text-ink-faint">{description}</span>
        )}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" className={cx("peer sr-only", className)} {...rest} />
        <span
          aria-hidden="true"
          className="block h-6 w-11 rounded-full border border-line-strong bg-sunken transition-colors duration-200 ease-out-quint peer-checked:border-ember peer-checked:bg-ember peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember peer-disabled:opacity-50"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-surface shadow-soft transition-transform duration-200 ease-out-quint peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
