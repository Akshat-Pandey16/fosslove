import type { ReactNode } from "react";
import type { Hue } from "@/lib/hues";
import { cx } from "./cx";

const HUE_DOT: Record<Hue, string> = {
  ember: "bg-ember",
  honey: "bg-honey",
  moss: "bg-moss",
  pine: "bg-pine",
  sky: "bg-sky",
  cobalt: "bg-cobalt",
  plum: "bg-plum",
  berry: "bg-berry",
};

export function Eyebrow({
  hue = "ember",
  children,
  className,
}: {
  hue?: Hue | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ink-muted",
        className,
      )}
    >
      <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-full", HUE_DOT[hue])} />
      {children}
    </span>
  );
}
