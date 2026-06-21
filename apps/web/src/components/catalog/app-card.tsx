import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { AppListItem } from "@/lib/api/types"
import { AddToBuilderButton } from "./add-to-builder-button"
import { PlatformBadge } from "./platform-badge"

export function AppCard({ app }: { app: AppListItem }) {
  return (
    <div className="hover-lift-glow group relative flex flex-col overflow-hidden rounded-xl border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-1.5 border-b bg-secondary/30 px-3 py-2">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="ml-1 truncate font-mono text-[11px] text-muted-foreground">
          {app.platform}/{app.slug}
        </span>
        <PlatformBadge platform={app.platform} compact className="ml-auto shrink-0" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Link href={`/apps/${app.platform}/${app.slug}`} className="block">
            <h3 className="truncate font-heading text-base font-semibold transition-colors group-hover:text-primary">
              {app.name}
            </h3>
          </Link>
          <Link
            href={`/categories/${app.category_slug}`}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            ~/{app.category_slug}
          </Link>
        </div>
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {app.summary ?? "No description provided."}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Link
            href={`/apps/${app.platform}/${app.slug}`}
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            details <ArrowUpRight className="size-3.5" />
          </Link>
          <AddToBuilderButton app={app} size="sm" />
        </div>
      </div>
    </div>
  )
}
