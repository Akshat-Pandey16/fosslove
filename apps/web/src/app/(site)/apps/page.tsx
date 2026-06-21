import { Boxes, Terminal } from "lucide-react"
import type { Metadata } from "next"
import { AppGrid } from "@/components/catalog/app-grid"
import { CatalogFilters } from "@/components/catalog/catalog-filters"
import { PaginationBar } from "@/components/catalog/pagination-bar"
import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/motion/reveal"
import { api } from "@/lib/api/client"
import { safe } from "@/lib/api/safe"
import type { AppListItem, Category, Page, Platform } from "@/lib/api/types"
import { PAGE_SIZE } from "@/lib/constants"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Apps",
  description: "Browse the full catalog of free and open-source apps for Windows and Linux.",
  alternates: { canonical: "/apps" },
}

const EMPTY_APPS: Page<AppListItem> = { items: [], meta: { page: 1, size: 0, total: 0, pages: 0 } }
const EMPTY_CATEGORIES: Page<Category> = {
  items: [],
  meta: { page: 1, size: 0, total: 0, pages: 0 },
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function toPlatform(value: string | string[] | undefined): Platform | undefined {
  return value === "windows" || value === "linux" ? value : undefined
}

export default async function AppsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const platform = toPlatform(params.platform)
  const categoryId = params.category_id ? Number(params.category_id) || undefined : undefined
  const q = typeof params.q === "string" ? params.q : undefined

  const [apps, categories] = await Promise.all([
    safe(
      api.catalog.listApps(
        { page, size: PAGE_SIZE, platform, category_id: categoryId, q },
        { next: { revalidate } },
      ),
      EMPTY_APPS,
    ),
    safe(api.catalog.listCategories({ size: 100 }, { next: { revalidate } }), EMPTY_CATEGORIES),
  ])

  return (
    <div className="relative">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60" />
      <Container className="relative space-y-8 py-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 font-mono text-xs text-primary/80">
              <Terminal className="size-3.5" /> ~/catalog/apps
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Browse apps</h1>
            <p className="text-muted-foreground">
              {apps.meta.total > 0
                ? `${apps.meta.total} open-source modules for Windows and Linux, ready to load into your deck.`
                : "Free and open-source apps for Windows and Linux."}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md border bg-card/60 px-3 py-1.5 font-mono text-xs text-muted-foreground backdrop-blur">
            <Boxes className="size-3.5 text-term-cyan" />
            {apps.meta.total > 0 ? `${apps.meta.total} modules` : "catalog online"}
          </span>
        </header>

        <CatalogFilters categories={categories.items} />

        <Reveal>
          <AppGrid
            apps={apps.items}
            emptyMessage={q ? `no apps match “${q}”` : "no apps found for these filters"}
          />
        </Reveal>

        <PaginationBar page={apps.meta.page} totalPages={apps.meta.pages} />
      </Container>
    </div>
  )
}
