import type { Metadata } from "next"
import { AppGrid } from "@/components/catalog/app-grid"
import { CatalogFilters } from "@/components/catalog/catalog-filters"
import { PaginationBar } from "@/components/catalog/pagination-bar"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api/client"
import { safe } from "@/lib/api/safe"
import type { AppListItem, Category, Page, Platform } from "@/lib/api/types"
import { PAGE_SIZE } from "@/lib/constants"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Apps",
  description: "Browse the full catalog of free and open-source apps for Windows and Linux.",
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
      api.catalog.listApps({ page, size: PAGE_SIZE, platform, category_id: categoryId, q }),
      EMPTY_APPS,
    ),
    safe(api.catalog.listCategories({ size: 100 }), EMPTY_CATEGORIES),
  ])

  return (
    <Container className="space-y-8 py-10">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Browse apps</h1>
        <p className="text-muted-foreground">
          {apps.meta.total > 0
            ? `${apps.meta.total} open-source apps for Windows and Linux.`
            : "Free and open-source apps for Windows and Linux."}
        </p>
      </header>
      <CatalogFilters categories={categories.items} />
      <AppGrid
        apps={apps.items}
        emptyMessage={q ? `No apps match “${q}”.` : "No apps found for these filters."}
      />
      <PaginationBar page={apps.meta.page} totalPages={apps.meta.pages} />
    </Container>
  )
}
