"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AppForm } from "@/components/admin/app-form"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"

export default function NewAppPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.catalog.listCategories({ size: 200 }),
  })

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/apps"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Apps
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight">New app</h1>
      </div>
      {isLoading ? (
        <Skeleton className="h-96 max-w-3xl rounded-xl" />
      ) : (
        <AppForm mode="create" categories={data?.items ?? []} />
      )}
    </div>
  )
}
