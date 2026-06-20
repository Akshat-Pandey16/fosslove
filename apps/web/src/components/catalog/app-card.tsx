import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { AppListItem } from "@/lib/api/types"
import { AddToBuilderButton } from "./add-to-builder-button"
import { PlatformBadge } from "./platform-badge"

export function AppCard({ app }: { app: AppListItem }) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/apps/${app.id}`} className="block">
            <h3 className="truncate font-heading text-base font-semibold transition-colors group-hover:text-primary">
              {app.name}
            </h3>
          </Link>
          <Link
            href={`/categories/${app.category_id}`}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {app.category_name}
          </Link>
        </div>
        <PlatformBadge platform={app.platform} />
      </div>
      <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {app.summary ?? "No description provided."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Link
          href={`/apps/${app.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Details <ArrowUpRight className="size-3.5" />
        </Link>
        <AddToBuilderButton app={app} size="sm" />
      </div>
    </div>
  )
}
