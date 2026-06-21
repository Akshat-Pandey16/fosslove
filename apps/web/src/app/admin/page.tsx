"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowUpRight, Loader2, Package, RefreshCw, Tag, Trash } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { SectionHeading } from "@/components/deck/section-heading"
import { Window } from "@/components/deck/window"
import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"

export default function AdminDashboardPage() {
  const categories = useQuery({
    queryKey: ["admin", "categories", "count"],
    queryFn: () => api.catalog.listCategories({ size: 1 }),
  })
  const apps = useQuery({
    queryKey: ["admin", "apps", "count"],
    queryFn: () => api.catalog.listApps({ size: 1 }),
  })

  const recompute = useMutation({
    mutationFn: () => api.admin.recomputeCounts(),
    onSuccess: () => toast.success("Category counts recomputed"),
    onError: (error) => toast.error(errorMessage(error)),
  })
  const cleanup = useMutation({
    mutationFn: () => api.admin.cleanupTokens(),
    onSuccess: (result) => {
      const total = Object.values(result).reduce((sum, value) => sum + value, 0)
      toast.success(`Removed ${total} expired token${total === 1 ? "" : "s"}`)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <div className="space-y-8">
      <SectionHeading
        tag="~/admin/dashboard"
        title="Command deck"
        description="Catalog metrics and platform configuration at a glance."
      />

      <Reveal className="grid gap-4 sm:grid-cols-2">
        <StatWindow
          href="/admin/categories"
          label="~/admin/categories"
          icon={Tag}
          stream="catalog.categories.count"
          value={categories.data?.meta.total}
          unit="categories"
        />
        <StatWindow
          href="/admin/apps"
          label="~/admin/apps"
          icon={Package}
          stream="catalog.apps.count"
          value={apps.data?.meta.total}
          unit="apps"
        />
      </Reveal>

      <Reveal>
        <Window label="~/admin/maintenance" glow>
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">Maintenance jobs</h2>
              <p className="font-mono text-xs text-muted-foreground">
                $ on-demand tasks — wire to a scheduler for periodic runs.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="hover-lift-glow"
                onClick={() => recompute.mutate()}
                disabled={recompute.isPending}
              >
                {recompute.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Recompute category counts
              </Button>
              <Button
                variant="outline"
                className="hover-lift-glow"
                onClick={() => cleanup.mutate()}
                disabled={cleanup.isPending}
              >
                {cleanup.isPending ? <Loader2 className="animate-spin" /> : <Trash />}
                Clean up expired tokens
              </Button>
            </div>
          </div>
        </Window>
      </Reveal>
    </div>
  )
}

function StatWindow({
  href,
  label,
  icon: Icon,
  stream,
  value,
  unit,
}: {
  href: string
  label: string
  icon: typeof Tag
  stream: string
  value: number | undefined
  unit: string
}) {
  return (
    <Link href={href} className="hover-lift-glow group block rounded-xl">
      <Window label={label} className="h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="text-term-lime">$</span> {stream}
            </div>
            <div className="font-heading text-4xl font-bold tabular-nums transition-colors group-hover:text-primary">
              {value ?? "—"}
            </div>
            <div className="font-mono text-xs text-muted-foreground">{unit}</div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Icon className="size-6 text-primary" />
            <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </div>
      </Window>
    </Link>
  )
}
