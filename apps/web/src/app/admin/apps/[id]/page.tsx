"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AppForm } from "@/components/admin/app-form"
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
    queryFn: () => api.catalog.listCategories({ size: 200 }),
  })

  const loading = app.isLoading || categories.isLoading

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/apps"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Apps
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {app.data ? app.data.name : "Edit app"}
        </h1>
      </div>
      {loading ? (
        <Skeleton className="h-96 max-w-3xl rounded-xl" />
      ) : app.isError || !app.data ? (
        <div className="space-y-4 rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">This app could not be loaded.</p>
          <Button variant="outline" render={<Link href="/admin/apps">Back to apps</Link>} />
        </div>
      ) : (
        <AppForm mode="edit" app={app.data} categories={categories.data?.items ?? []} />
      )}
    </div>
  )
}
