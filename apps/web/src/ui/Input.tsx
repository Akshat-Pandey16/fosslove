import type { ComponentPropsWithoutRef } from "react";
import { cx } from "./cx";
import { CloseIcon, SearchIcon } from "./icons";

const BASE =
  "h-11 w-full rounded-full border bg-surface px-5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed";

const NEUTRAL = "border-line focus:border-ember focus:ring-ember/15";
const INVALID = "border-ember focus:border-ember focus:ring-ember/25";

export interface InputProps extends ComponentPropsWithoutRef<"input"> {
  invalid?: boolean | undefined;
}

export function Input({ invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid ? true : undefined}
      className={cx(BASE, invalid ? INVALID : NEUTRAL, className)}
      {...rest}
    />
  );
}

export interface SearchInputProps extends Omit<InputProps, "type"> {
  onClear?: (() => void) | undefined;
  containerClassName?: string | undefined;
}

export function SearchInput({
  className,
  containerClassName,
  onClear,
  value,
  ...rest
}: SearchInputProps) {
  const clearable = onClear !== undefined && typeof value === "string" && value !== "";

  return (
    <div className={cx("relative", containerClassName)}>
      <SearchIcon
        size={18}
        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink-faint"
      />
      <Input
        type="search"
        value={value}
        className={cx(
          "pl-12 [&::-webkit-search-cancel-button]:appearance-none",
          clearable && "pr-12",
          className,
        )}
        {...rest}
      />
      {clearable && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-sunken hover:text-ink"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}
