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
      <div className="bg-grid-sm relative overflow-hidden rounded-xl border border-dashed p-12 text-center">
        <p className="font-mono text-sm text-muted-foreground">
          <span className="text-muted-foreground/50">$ </span>
          {emptyMessage}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5",
        className,
      )}
    >
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
