import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AppGrid } from "@/components/catalog/app-grid"
import { CatalogFilters } from "@/components/catalog/catalog-filters"
import { PaginationBar } from "@/components/catalog/pagination-bar"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import { safe } from "@/lib/api/safe"
import type { AppListItem, Category, Page, Platform } from "@/lib/api/types"
import { PAGE_SIZE } from "@/lib/constants"

export const revalidate = 300

const EMPTY_APPS: Page<AppListItem> = { items: [], meta: { page: 1, size: 0, total: 0, pages: 0 } }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

async function loadCategory(slug: string): Promise<Category> {
  try {
    return await api.catalog.getCategoryBySlug(slug, { next: { revalidate } })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    throw error
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const category = await api.catalog.getCategoryBySlug(slug, { next: { revalidate } })
    const description = category.description ?? `${category.name} apps on FOSSLove.`
    const canonical = `/categories/${category.slug}`
    return {
      title: category.name,
      description,
      alternates: { canonical },
      openGraph: { title: category.name, description, url: canonical, type: "website" },
    }
  } catch {
    return { title: "Category" }
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const category = await loadCategory(slug)

  const page = Math.max(1, Number(sp.page) || 1)
  const platform: Platform | undefined =
    sp.platform === "windows" || sp.platform === "linux" ? sp.platform : undefined
  const q = typeof sp.q === "string" ? sp.q : undefined

  const apps = await safe(
    api.catalog.listApps(
      { category_id: category.id, page, size: PAGE_SIZE, platform, q },
      { next: { revalidate } },
    ),
    EMPTY_APPS,
  )

  const total = category.windows_app_count + category.linux_app_count

  return (
    <Container className="space-y-8 py-10">
      <div className="relative overflow-hidden rounded-xl border bg-card/40">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-3.5" /> ~/categories
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-term-cyan">{category.slug}</span>
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">{category.name}</h1>
          {category.description ? (
            <p className="max-w-2xl text-muted-foreground text-pretty">{category.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-term-lime" /> {total} module
              {total === 1 ? "" : "s"} indexed
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>{category.windows_app_count} windows</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{category.linux_app_count} linux</span>
          </div>
        </div>
      </div>
      <CatalogFilters categories={[]} hideCategory />
      <AppGrid apps={apps.items} emptyMessage="No apps in this category yet." />
      <PaginationBar page={apps.meta.page} totalPages={apps.meta.pages} />
    </Container>
  )
}
