import type { PackageManager } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export function ManagerBadge({
  manager,
  className,
}: {
  manager: PackageManager
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-border bg-secondary/40 px-1.5 py-0.5 font-mono text-[11px] text-term-cyan",
        className,
      )}
    >
      <span aria-hidden className="text-muted-foreground/60">
        :
      </span>
      {manager}
    </span>
  )
}
