import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cx } from "./cx";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
  className,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
  className?: string | undefined;
}) {
  const reduced = useReducedMotion();
  const instanceId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const option = options[index];
    if (option === undefined) return;
    onChange(option.value);
    buttons.current[index]?.focus();
  };

  const move = (delta: number) => {
    const current = options.findIndex((option) => option.value === value);
    const base = current < 0 ? 0 : current;
    select((base + delta + options.length) % options.length);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(options.length - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={name}
      onKeyDown={onKeyDown}
      className={cx("inline-flex items-center gap-1 rounded-full bg-sunken p-1", className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => {
              onChange(option.value);
            }}
            className={cx(
              "relative inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-out-quint",
              active ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {active &&
              (reduced === true ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-surface shadow-soft"
                />
              ) : (
                <motion.span
                  layoutId={`segmented-indicator-${instanceId}`}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-surface shadow-soft"
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            <span className="relative inline-flex items-center gap-2">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
