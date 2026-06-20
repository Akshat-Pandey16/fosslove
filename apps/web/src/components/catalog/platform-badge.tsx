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
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs font-medium",
        platform === "windows"
          ? "border-sky-500/30 text-sky-600 dark:text-sky-400"
          : "border-amber-500/30 text-amber-600 dark:text-amber-400",
        compact && "px-1.5",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          platform === "windows" ? "bg-sky-500" : "bg-amber-500",
        )}
      />
      {compact ? null : PLATFORM_LABELS[platform]}
    </span>
  )
}
