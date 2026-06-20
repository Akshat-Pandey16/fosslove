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
        "inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground",
        className,
      )}
    >
      {manager}
    </span>
  )
}
