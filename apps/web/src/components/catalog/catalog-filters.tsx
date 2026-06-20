"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Category } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const PLATFORM_OPTIONS = [
  { value: "all", label: "All" },
  { value: "windows", label: "Windows" },
  { value: "linux", label: "Linux" },
]

export function CatalogFilters({
  categories,
  hideCategory = false,
}: {
  categories: Category[]
  hideCategory?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const platform = searchParams.get("platform") ?? "all"
  const categoryId = searchParams.get("category_id") ?? "all"
  const q = searchParams.get("q") ?? ""

  const categoryItems: Record<string, string> = {
    all: "All categories",
    ...Object.fromEntries(categories.map((category) => [String(category.id), category.name])),
  }

  const update = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    params.delete("page")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const onSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    update({ q: String(data.get("q") ?? "") })
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <form onSubmit={onSearch} className="relative w-full lg:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Search apps…" className="h-9 pl-9" />
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border p-0.5">
          {PLATFORM_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ platform: option.value })}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                platform === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {hideCategory ? null : (
          <Select
            items={categoryItems}
            value={categoryId}
            onValueChange={(value) => update({ category_id: String(value) })}
          >
            <SelectTrigger className="h-9 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
