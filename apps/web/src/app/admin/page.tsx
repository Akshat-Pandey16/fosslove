"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Package, RefreshCw, Tag, Trash } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
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
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Manage the catalog and platform configuration.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/categories"
          className="group flex items-center justify-between rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div>
            <div className="font-heading text-3xl font-bold">
              {categories.data?.meta.total ?? "—"}
            </div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
          <Tag className="size-6 text-primary" />
        </Link>
        <Link
          href="/admin/apps"
          className="group flex items-center justify-between rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div>
            <div className="font-heading text-3xl font-bold">{apps.data?.meta.total ?? "—"}</div>
            <div className="text-sm text-muted-foreground">Apps</div>
          </div>
          <Package className="size-6 text-primary" />
        </Link>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2 className="font-heading text-lg font-semibold">Maintenance</h2>
          <p className="text-sm text-muted-foreground">
            On-demand jobs you can also wire to a scheduler.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => recompute.mutate()}
            disabled={recompute.isPending}
          >
            {recompute.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Recompute category counts
          </Button>
          <Button variant="outline" onClick={() => cleanup.mutate()} disabled={cleanup.isPending}>
            {cleanup.isPending ? <Loader2 className="animate-spin" /> : <Trash />}
            Clean up expired tokens
          </Button>
        </div>
      </section>
    </div>
  )
}
