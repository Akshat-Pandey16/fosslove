import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { nextTheme, type Theme } from "@/theme/theme";
import { useTheme } from "@/theme/useTheme";
import { MonitorIcon, MoonIcon, SunIcon, cx } from "@/ui";

const EASE = [0.22, 1, 0.36, 1] as const;

const LABELS: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function ThemeGlyph({ theme, size }: { theme: Theme; size: number }) {
  if (theme === "light") return <SunIcon size={size} />;
  if (theme === "dark") return <MoonIcon size={size} />;
  return <MonitorIcon size={size} />;
}

export function ThemeToggle({
  className,
  size = 18,
  withLabel = false,
}: {
  className?: string | undefined;
  size?: number | undefined;
  withLabel?: boolean | undefined;
}) {
  const { theme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const upcoming = nextTheme(theme);

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(upcoming);
      }}
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[upcoming]}.`}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 ease-out-quint hover:bg-sunken hover:text-ink",
        withLabel ? "h-9 gap-2 border border-line bg-surface px-3.5 text-sm" : "size-9",
        className,
      )}
    >
      <span className="inline-flex size-5 items-center justify-center">
        {reduced === true ? (
          <ThemeGlyph theme={theme} size={size} />
        ) : (
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="inline-flex"
            >
              <ThemeGlyph theme={theme} size={size} />
            </motion.span>
          </AnimatePresence>
        )}
      </span>
      {withLabel && <span aria-hidden="true">{LABELS[theme]}</span>}
    </button>
  );
}
