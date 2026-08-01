import type { ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import { ChevronDownIcon } from "./icons";

const BASE =
  "h-11 w-full appearance-none rounded-full border bg-surface pl-5 pr-11 text-sm text-ink transition-colors focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed";

const NEUTRAL = "border-line focus:border-ember focus:ring-ember/15";
const INVALID = "border-ember focus:border-ember focus:ring-ember/25";

export interface SelectProps extends ComponentPropsWithoutRef<"select"> {
  invalid?: boolean | undefined;
  containerClassName?: string | undefined;
}

export function Select({
  invalid = false,
  className,
  containerClassName,
  children,
  ...rest
}: SelectProps) {
  return (
    <div className={cx("relative", containerClassName)}>
      <select
        aria-invalid={invalid ? true : undefined}
        className={cx(BASE, invalid ? INVALID : NEUTRAL, className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDownIcon
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint"
      />
    </div>
  );
}
