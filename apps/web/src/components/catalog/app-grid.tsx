import type { AppListItem } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { AppCard } from "./app-card"

export function AppGrid({
  apps,
  className,
  emptyMessage = "No apps found.",
}: {
  apps: AppListItem[]
  className?: string
  emptyMessage?: string
}) {
  if (apps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        className,
      )}
    >
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
