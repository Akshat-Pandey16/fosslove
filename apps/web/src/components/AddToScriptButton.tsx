import { motion, useReducedMotion } from "motion/react";
import type { App, AppDetail } from "@/api/types";
import { useScriptBag } from "@/scriptbag/useScriptBag";
import { CheckIcon, PlusIcon, cx } from "@/ui";

const SIZES = {
  sm: "size-8",
  md: "size-9",
} as const;

export function AddToScriptButton({
  app,
  size = "md",
  className,
}: {
  app: App | AppDetail;
  size?: "sm" | "md";
  className?: string | undefined;
}) {
  const bag = useScriptBag();
  const reduced = useReducedMotion();
  const added = bag.has(app.id);

  return (
    <motion.button
      type="button"
      aria-pressed={added}
      aria-label={added ? `Remove ${app.name} from your script` : `Add ${app.name} to your script`}
      {...(reduced === true ? {} : { whileTap: { scale: 0.86 } })}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        bag.toggle({ id: app.id, name: app.name, slug: app.slug, platform: app.platform });
      }}
      className={cx(
        "inline-grid place-items-center rounded-full border transition-colors duration-200 ease-out-quint",
        SIZES[size],
        added
          ? "border-ember bg-ember text-white"
          : "border-line bg-surface text-ink-muted hover:border-ember hover:text-ember",
        className,
      )}
    >
      {added ? <CheckIcon size={size === "sm" ? 14 : 16} /> : <PlusIcon size={size === "sm" ? 14 : 16} />}
    </motion.button>
  );
}
