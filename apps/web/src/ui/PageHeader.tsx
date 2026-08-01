import type { ReactNode } from "react";
import type { Hue } from "@/lib/hues";
import { cx } from "./cx";
import { Eyebrow } from "./Eyebrow";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  hue = "ember",
  className,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
  hue?: Hue | undefined;
  className?: string | undefined;
}) {
  return (
    <header
      className={cx(
        "mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        {eyebrow === undefined ? null : <Eyebrow hue={hue}>{eyebrow}</Eyebrow>}
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.03em] text-ink">
          {title}
        </h1>
        {description === undefined ? null : (
          <p className="max-w-[58ch] text-base leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {actions === undefined ? null : (
        <div className="flex flex-wrap items-center gap-3 md:shrink-0 md:justify-end">{actions}</div>
      )}
    </header>
  );
}
