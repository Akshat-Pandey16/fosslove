import type { ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";

const BASE =
  "min-h-28 w-full rounded-lg border bg-surface px-5 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed";

const NEUTRAL = "border-line focus:border-ember focus:ring-ember/15";
const INVALID = "border-ember focus:border-ember focus:ring-ember/25";

export interface TextareaProps extends ComponentPropsWithoutRef<"textarea"> {
  invalid?: boolean | undefined;
}

export function Textarea({ invalid = false, className, ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid ? true : undefined}
      className={cx(BASE, invalid ? INVALID : NEUTRAL, className)}
      {...rest}
    />
  );
}
