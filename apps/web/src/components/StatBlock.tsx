import { formatCount } from "@/lib/format";
import type { Hue } from "@/lib/hues";
import { Skeleton, cx } from "@/ui";

const HUE_RULE: Record<Hue, string> = {
  ember: "bg-ember",
  honey: "bg-honey",
  moss: "bg-moss",
  pine: "bg-pine",
  sky: "bg-sky",
  cobalt: "bg-cobalt",
  plum: "bg-plum",
  berry: "bg-berry",
};

export function StatBlock({
  value,
  label,
  hue = "ember",
  pending = false,
}: {
  value: number | string;
  label: string;
  hue?: Hue | undefined;
  pending?: boolean | undefined;
}) {
  return (
    <div className="flex flex-col gap-3" aria-busy={pending}>
      <span aria-hidden="true" className={cx("h-1 w-10 rounded-full", HUE_RULE[hue])} />
      {pending ? (
        <Skeleton className="h-[clamp(2.5rem,5vw,4rem)] w-32 rounded-lg" />
      ) : (
        <span className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-[-0.03em] text-ink">
          {typeof value === "number" ? formatCount(value) : value}
        </span>
      )}
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </span>
    </div>
  );
}
