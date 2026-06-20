"use client"

import { useQuery } from "@tanstack/react-query"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import { formatDate } from "@/lib/constants"

export default function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["history", "list"],
    queryFn: () => api.scripts.history({ size: 50 }),
  })

  const runs = data?.items ?? []

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Script history</h1>
        <p className="text-muted-foreground">Scripts you've generated. Re-download any of them.</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No scripts generated yet.
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {runs.map((run) => (
            <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <PlatformBadge platform={run.platform} />
                <div>
                  <div className="text-sm font-medium">
                    {run.app_count} app{run.app_count === 1 ? "" : "s"}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(run.created_at)}</div>
                </div>
              </div>
              <GenerateScriptButton
                platform={run.platform}
                appIds={run.app_ids}
                variant="outline"
                size="sm"
              >
                Download again
              </GenerateScriptButton>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
