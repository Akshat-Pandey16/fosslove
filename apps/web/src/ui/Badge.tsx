import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { Hue } from "@/lib/hues";
import { cx } from "./cx";

const HUE_SOFT: Record<Hue, string> = {
  ember: "bg-ember-soft text-ember-ink",
  honey: "bg-honey-soft text-honey-ink",
  moss: "bg-moss-soft text-moss-ink",
  pine: "bg-pine-soft text-pine-ink",
  sky: "bg-sky-soft text-sky-ink",
  cobalt: "bg-cobalt-soft text-cobalt-ink",
  plum: "bg-plum-soft text-plum-ink",
  berry: "bg-berry-soft text-berry-ink",
};

const NEUTRAL = "bg-sunken text-ink-muted";

const SIZES: Record<"sm" | "md", string> = {
  sm: "text-[0.625rem] px-2.5 py-1",
  md: "text-[0.6875rem] px-3 py-1.5",
};

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  hue?: Hue | undefined;
  icon?: ReactNode;
  size?: "sm" | "md" | undefined;
}

export function Badge({ hue, icon, size = "md", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-[0.14em] leading-none whitespace-nowrap",
        SIZES[size],
        hue === undefined ? NEUTRAL : HUE_SOFT[hue],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
