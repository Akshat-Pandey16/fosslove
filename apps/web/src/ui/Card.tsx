import type { ComponentPropsWithoutRef } from "react";
import type { Hue } from "@/lib/hues";
import { cx } from "./cx";

const HUE_HOVER_BORDER: Record<Hue, string> = {
  ember: "hover:border-ember",
  honey: "hover:border-honey",
  moss: "hover:border-moss",
  pine: "hover:border-pine",
  sky: "hover:border-sky",
  cobalt: "hover:border-cobalt",
  plum: "hover:border-plum",
  berry: "hover:border-berry",
};

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  interactive?: boolean | undefined;
  hue?: Hue | undefined;
  padded?: boolean | undefined;
}

export function Card({
  interactive = false,
  hue,
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        "bg-surface border border-line rounded-xl shadow-soft",
        padded && "p-6",
        interactive && "transition-all duration-200 ease-out-quint hover:-translate-y-1 hover:shadow-lift",
        interactive && (hue === undefined ? "hover:border-line-strong" : HUE_HOVER_BORDER[hue]),
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
