"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AppForm } from "@/components/admin/app-form"
import { SectionHeading } from "@/components/deck/section-heading"
import { Window } from "@/components/deck/window"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"

export default function EditAppPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const app = useQuery({
    queryKey: ["admin", "app", id],
    queryFn: () => api.catalog.getApp(id),
    enabled: Number.isInteger(id),
  })
  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.catalog.listCategories({ size: 100 }),
  })

  const loading = app.isLoading || categories.isLoading

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/admin/apps"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" /> ~/admin/apps
        </Link>
        <SectionHeading
          tag="~/admin/apps/edit"
          title={app.data ? app.data.name : "Edit app"}
          description="Update app metadata and package sources."
        />
      </div>
      {loading ? (
        <Skeleton className="h-96 max-w-3xl rounded-xl" />
      ) : app.isError || !app.data ? (
        <Window label="~/admin/apps/error" className="max-w-3xl">
          <div className="space-y-4 py-8 text-center">
            <p className="font-mono text-sm text-destructive">! this app could not be loaded.</p>
            <Button variant="outline" render={<Link href="/admin/apps">Back to apps</Link>} />
          </div>
        </Window>
      ) : (
        <AppForm mode="edit" app={app.data} categories={categories.data?.items ?? []} />
      )}
    </div>
  )
}
