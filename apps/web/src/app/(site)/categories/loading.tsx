import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="relative">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60" />
      <Container className="relative space-y-8 py-10">
        <header className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-5 w-72" />
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border bg-card/50">
              <div className="flex items-center gap-2 border-b bg-secondary/30 px-3 py-2">
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2 h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
