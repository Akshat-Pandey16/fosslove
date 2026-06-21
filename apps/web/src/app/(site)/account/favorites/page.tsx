"use client"

import { useQuery } from "@tanstack/react-query"
import { AppGrid } from "@/components/catalog/app-grid"
import { SectionHeading } from "@/components/deck/section-heading"
import { Reveal } from "@/components/motion/reveal"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"

export default function FavoritesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites", "list"],
    queryFn: () => api.favorites.list({ size: 100 }),
  })

  return (
    <div className="space-y-6">
      <SectionHeading
        tag="~/account/favorites"
        title="Favorites"
        description="Apps you've saved for later."
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <Reveal>
          <AppGrid
            apps={data?.items ?? []}
            emptyMessage="No favorites yet. Tap the heart on any app to save it."
          />
        </Reveal>
      )}
    </div>
  )
}
