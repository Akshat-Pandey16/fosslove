import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <Container className="space-y-8 py-10">
      <header className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72" />
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="size-4 rounded" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-auto h-4 w-24" />
          </div>
        ))}
      </div>
    </Container>
  )
}
