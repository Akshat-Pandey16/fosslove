"use client"

import { useQuery } from "@tanstack/react-query"
import { AppGrid } from "@/components/catalog/app-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"

export default function FavoritesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites", "list"],
    queryFn: () => api.favorites.list({ size: 100 }),
  })

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground">Apps you've saved for later.</p>
      </header>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <AppGrid
          apps={data?.items ?? []}
          emptyMessage="No favorites yet. Tap the heart on any app to save it."
        />
      )}
    </div>
  )
}
