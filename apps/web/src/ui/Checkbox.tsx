import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "./cx";
import { CheckIcon } from "./icons";

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  label: ReactNode;
  description?: string | undefined;
  labelClassName?: string | undefined;
  containerClassName?: string | undefined;
}

export function Checkbox({
  label,
  description,
  className,
  labelClassName,
  containerClassName,
  ...rest
}: CheckboxProps) {
  return (
    <label
      className={cx(
        "group inline-flex cursor-pointer select-none items-start gap-3",
        containerClassName,
      )}
    >
      <input type="checkbox" className={cx("peer sr-only", className)} {...rest} />
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[0.4rem] border border-line-strong bg-surface text-transparent transition-colors duration-200 ease-out-quint peer-checked:border-ember peer-checked:bg-ember peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember peer-disabled:opacity-50"
      >
        <CheckIcon size={13} strokeWidth={2.8} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cx("text-sm leading-snug text-ink", labelClassName)}>{label}</span>
        {description === undefined ? null : (
          <span className="text-xs leading-relaxed text-ink-faint">{description}</span>
        )}
      </span>
    </label>
  );
}
