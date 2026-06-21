"use client"

import { useQuery } from "@tanstack/react-query"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { SectionHeading } from "@/components/deck/section-heading"
import { Window } from "@/components/deck/window"
import { Reveal } from "@/components/motion/reveal"
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
      <SectionHeading
        tag="~/account/history"
        title="Script history"
        description="Scripts you've generated. Re-download any of them."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center font-mono text-sm text-muted-foreground">
          $ no scripts generated yet
        </div>
      ) : (
        <Reveal>
          <Window label="~/account/history.log" bodyClassName="p-0">
            <ul className="divide-y">
              {runs.map((run) => (
                <li
                  key={run.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="size-1.5 rounded-full bg-term-lime" />
                    <PlatformBadge platform={run.platform} />
                    <div className="font-mono text-sm">
                      <span className="text-term-cyan">
                        {run.app_count} app{run.app_count === 1 ? "" : "s"}
                      </span>
                      <span className="text-muted-foreground"> · {formatDate(run.created_at)}</span>
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
                </li>
              ))}
            </ul>
          </Window>
        </Reveal>
      )}
    </div>
  )
}
