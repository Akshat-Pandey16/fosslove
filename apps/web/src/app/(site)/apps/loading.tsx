import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="relative">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60" />
      <Container className="relative space-y-8 py-10">
        <header className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72" />
        </header>
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border bg-card/50">
              <div className="flex items-center gap-2 border-b bg-secondary/30 px-3 py-2">
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-7 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
