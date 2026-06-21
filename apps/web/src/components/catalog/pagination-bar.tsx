"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export function PaginationBar({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) {
    return null
  }

  const goto = (target: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (target <= 1) {
      params.delete("page")
    } else {
      params.set("page", String(target))
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goto(page - 1)}>
        <ChevronLeft /> Prev
      </Button>
      <span className="rounded-md border bg-card/50 px-3 py-1.5 font-mono text-xs text-muted-foreground">
        <span className="text-primary">{String(page).padStart(2, "0")}</span>
        <span className="text-muted-foreground/50"> / </span>
        {String(totalPages).padStart(2, "0")}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goto(page + 1)}
      >
        Next <ChevronRight />
      </Button>
    </div>
  )
}
