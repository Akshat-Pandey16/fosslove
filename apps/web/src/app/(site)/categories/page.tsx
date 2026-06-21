import { ArrowUpRight, Layers } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/motion/reveal"
import { api } from "@/lib/api/client"
import { safe } from "@/lib/api/safe"
import type { Category, Page } from "@/lib/api/types"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse open-source apps by category.",
  alternates: { canonical: "/categories" },
}

const EMPTY: Page<Category> = { items: [], meta: { page: 1, size: 0, total: 0, pages: 0 } }

export default async function CategoriesPage() {
  const categories = await safe(
    api.catalog.listCategories({ size: 100 }, { next: { revalidate } }),
    EMPTY,
  )

  return (
    <div className="relative">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60" />
      <Container className="relative space-y-8 py-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 font-mono text-xs text-primary/80">
              <Layers className="size-3.5" /> ~/catalog/categories
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Modules by category</h1>
            <p className="text-muted-foreground">
              {categories.meta.total} categories of free and open-source software.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md border bg-card/60 px-3 py-1.5 font-mono text-xs text-muted-foreground backdrop-blur">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-term-lime" />
            {categories.meta.total > 0 ? `${categories.meta.total} categories` : "catalog online"}
          </span>
        </header>

        {categories.items.length === 0 ? (
          <div className="bg-grid-sm relative overflow-hidden rounded-xl border border-dashed p-12 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              <span className="text-muted-foreground/50">$ </span>no categories yet
            </p>
          </div>
        ) : (
          <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.items.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="hover-lift-glow group flex flex-col overflow-hidden rounded-xl border bg-card/50 backdrop-blur"
              >
                <div className="flex items-center gap-1.5 border-b bg-secondary/30 px-3 py-2">
                  <span aria-hidden className="flex gap-1.5">
                    <span className="size-2 rounded-full bg-muted-foreground/30" />
                    <span className="size-2 rounded-full bg-muted-foreground/30" />
                  </span>
                  <span className="ml-1 truncate font-mono text-[11px] text-muted-foreground">
                    ~/{category.slug}
                  </span>
                  <ArrowUpRight className="ml-auto size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h2 className="font-heading text-lg font-semibold transition-colors group-hover:text-primary">
                    {category.name}
                  </h2>
                  {category.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span className="text-sky-600 dark:text-sky-300">
                      {category.windows_app_count} win
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-amber-600 dark:text-amber-300">
                      {category.linux_app_count} linux
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </Reveal>
        )}
      </Container>
    </div>
  )
}
