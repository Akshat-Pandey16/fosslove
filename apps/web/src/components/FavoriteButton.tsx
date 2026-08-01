import type { MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useToggleFavorite } from "@/features/favorites/hooks";
import { HeartFilledIcon, HeartIcon, cx } from "@/ui";

const SIZES: Record<"sm" | "md", string> = {
  sm: "size-8",
  md: "size-10",
};

const ICON_SIZES: Record<"sm" | "md", number> = {
  sm: 15,
  md: 18,
};

export function FavoriteButton({
  appId,
  isFavorite,
  size = "md",
}: {
  appId: number;
  isFavorite: boolean;
  size?: "sm" | "md" | undefined;
}) {
  const toggle = useToggleFavorite();
  const reduced = useReducedMotion();

  const label = isFavorite ? "Remove from favourites" : "Add to favourites";
  const iconSize = ICON_SIZES[size];
  const pop = reduced === true ? {} : { initial: { scale: 0.55 }, animate: { scale: 1 } };
  const tap = reduced === true ? {} : { whileTap: { scale: 0.88 } };

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toggle.mutate({ appId, isFavorite });
  };

  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-pressed={isFavorite}
      aria-busy={toggle.isPending}
      title={label}
      onClick={onClick}
      {...tap}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full border transition-colors duration-200 ease-out-quint",
        SIZES[size],
        isFavorite
          ? "border-berry/40 bg-berry-soft text-berry"
          : "border-line bg-surface text-ink-faint hover:border-berry hover:text-berry",
      )}
    >
      <motion.span
        key={isFavorite ? "on" : "off"}
        className="inline-grid place-items-center"
        transition={{ duration: 0.26, ease: [0.34, 1.56, 0.64, 1] }}
        {...pop}
      >
        {isFavorite ? <HeartFilledIcon size={iconSize} /> : <HeartIcon size={iconSize} />}
      </motion.span>
    </motion.button>
  );
}
