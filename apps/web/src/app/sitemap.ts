import type { MetadataRoute } from "next"
import { api } from "@/lib/api/client"
import { safe } from "@/lib/api/safe"
import type { AppListItem, Category, Page } from "@/lib/api/types"

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const pageSize = 100
const maxAppPages = 50

const emptyPage = <T>(): Page<T> => ({
  items: [],
  meta: { page: 1, size: pageSize, total: 0, pages: 0 },
})

const staticRoutes = (now: Date): MetadataRoute.Sitemap => [
  { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
  { url: `${base}/apps`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  { url: `${base}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  { url: `${base}/collections`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
]

const categoryRoutes = async (now: Date): Promise<MetadataRoute.Sitemap> => {
  const entries: MetadataRoute.Sitemap = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const result = await safe(
      api.catalog.listCategories({ page, size: pageSize }),
      emptyPage<Category>(),
    )
    for (const category of result.items) {
      entries.push({
        url: `${base}/categories/${category.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
    totalPages = result.meta.pages
    page += 1
  }

  return entries
}

const appRoutes = async (now: Date): Promise<MetadataRoute.Sitemap> => {
  const entries: MetadataRoute.Sitemap = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= maxAppPages) {
    const result = await safe(
      api.catalog.listApps({ page, size: pageSize }),
      emptyPage<AppListItem>(),
    )
    for (const app of result.items) {
      entries.push({
        url: `${base}/apps/${app.platform}/${app.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
    totalPages = result.meta.pages
    page += 1
  }

  return entries
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [categories, apps] = await Promise.all([categoryRoutes(now), appRoutes(now)])
  return [...staticRoutes(now), ...categories, ...apps]
}
