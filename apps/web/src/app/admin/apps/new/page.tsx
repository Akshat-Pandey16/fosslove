"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AppForm } from "@/components/admin/app-form"
import { SectionHeading } from "@/components/deck/section-heading"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"

export default function NewAppPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.catalog.listCategories({ size: 100 }),
  })

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
          tag="~/admin/apps/new"
          title="New app"
          description="Register a new app and its package sources."
        />
      </div>
      {isLoading ? (
        <Skeleton className="h-96 max-w-3xl rounded-xl" />
      ) : (
        <AppForm mode="create" categories={data?.items ?? []} />
      )}
    </div>
  )
}
