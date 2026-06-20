import { ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api/client"
import { safe } from "@/lib/api/safe"
import type { Category, Page } from "@/lib/api/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse open-source apps by category.",
}

const EMPTY: Page<Category> = { items: [], meta: { page: 1, size: 0, total: 0, pages: 0 } }

export default async function CategoriesPage() {
  const categories = await safe(api.catalog.listCategories({ size: 100 }), EMPTY)

  return (
    <Container className="space-y-8 py-10">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          {categories.meta.total} categories of free and open-source software.
        </p>
      </header>

      {categories.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No categories yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.items.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-heading text-lg font-semibold transition-colors group-hover:text-primary">
                  {category.name}
                </h2>
                <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              {category.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
              ) : null}
              <div className="mt-auto flex items-center gap-3 font-mono text-xs text-muted-foreground">
                <span>{category.windows_app_count} win</span>
                <span>·</span>
                <span>{category.linux_app_count} linux</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  )
}
