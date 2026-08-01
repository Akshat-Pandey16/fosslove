import type { ReactNode } from "react";
import { cx } from "./cx";

export function Terminal({
  title,
  children,
  className,
  actions,
}: {
  title?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cx("overflow-hidden rounded-lg bg-terminal text-terminal-ink shadow-lift", className)}
    >
      <div className="flex h-10 items-center gap-2 border-b border-white/10 px-4">
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-ember/70" />
          <span className="size-2.5 rounded-full bg-honey/70" />
          <span className="size-2.5 rounded-full bg-moss/70" />
        </span>
        <span className="min-w-0 flex-1 truncate text-center font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-white/45">
          {title}
        </span>
        {actions === undefined ? (
          <span aria-hidden="true" className="w-[2.625rem] shrink-0" />
        ) : (
          <span className="flex shrink-0 items-center gap-1">{actions}</span>
        )}
      </div>
      <div className="overflow-x-auto p-5 font-mono text-[0.8125rem] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function TerminalLine({
  children,
  prompt = "$",
  muted = false,
}: {
  children: ReactNode;
  prompt?: string | undefined;
  muted?: boolean | undefined;
}) {
  return (
    <p className={cx("flex gap-2 whitespace-pre-wrap", muted && "text-terminal-ink/55")}>
      {prompt === "" ? null : (
        <span aria-hidden="true" className={cx("shrink-0 select-none", muted ? "text-terminal-ink/40" : "text-ember")}>
          {prompt}
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </p>
  );
}
