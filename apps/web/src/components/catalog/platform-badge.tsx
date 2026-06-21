import type { Platform } from "@/lib/api/types"
import { PLATFORM_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function PlatformBadge({
  platform,
  compact = false,
  className,
}: {
  platform: Platform
  compact?: boolean
  className?: string
}) {
  return (
    <span
      title={compact ? PLATFORM_LABELS[platform] : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] tracking-wide uppercase",
        platform === "windows"
          ? "border-sky-500/35 bg-sky-500/10 text-sky-600 dark:text-sky-300"
          : "border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-300",
        compact && "px-1.5",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          platform === "windows"
            ? "bg-sky-500 shadow-[0_0_6px] shadow-sky-500/60"
            : "bg-amber-500 shadow-[0_0_6px] shadow-amber-500/60",
        )}
      />
      {compact ? (
        <span className="sr-only">{PLATFORM_LABELS[platform]}</span>
      ) : (
        PLATFORM_LABELS[platform]
      )}
    </span>
  )
}
