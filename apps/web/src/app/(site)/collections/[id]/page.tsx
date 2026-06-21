import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddCollectionToBuilder } from "@/components/builder/add-collection-to-builder"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { Window } from "@/components/deck/window"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import type { CollectionDetail } from "@/lib/api/types"
import { PLATFORM_LABELS, PLATFORMS } from "@/lib/constants"

export const revalidate = 300

async function loadCollection(idParam: string): Promise<CollectionDetail> {
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    notFound()
  }
  try {
    return await api.collections.get(id, { next: { revalidate } })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound()
    }
    throw error
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const collection = await api.collections.get(Number(id), { next: { revalidate } })
    const description = collection.description ?? `${collection.name} collection on FOSSLove.`
    const canonical = `/collections/${collection.id}`
    return {
      title: collection.name,
      description,
      alternates: { canonical },
      openGraph: { title: collection.name, description, url: canonical, type: "website" },
    }
  } catch {
    return { title: "Collection" }
  }
}

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const collection = await loadCollection(id)
  const items = [...collection.items].sort((a, b) => a.position - b.position)
  const apps = items.map((item) => item.app)
  const platformsWithApps = PLATFORMS.filter((platform) =>
    apps.some((app) => app.platform === platform),
  )

  return (
    <Container className="space-y-8 py-10">
      <div className="relative overflow-hidden rounded-xl border bg-card/40">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <ArrowLeft className="size-3.5" /> ~/collections
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-term-cyan">{collection.slug}</span>
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight">{collection.name}</h1>
          {collection.description ? (
            <p className="max-w-2xl text-muted-foreground text-pretty">{collection.description}</p>
          ) : null}
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-term-lime" /> {collection.item_count} app
            {collection.item_count === 1 ? "" : "s"} bundled
          </span>
        </div>
      </div>

      <div className="panel flex flex-wrap items-center gap-3 rounded-xl p-4">
        <span className="font-mono text-[11px] text-muted-foreground">
          $ deck load --collection
        </span>
        <AddCollectionToBuilder apps={apps} />
        {platformsWithApps.map((platform) => (
          <GenerateScriptButton
            key={platform}
            platform={platform}
            collectionId={collection.id}
            variant="outline"
          >
            {PLATFORM_LABELS[platform]} script
          </GenerateScriptButton>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="bg-grid-sm rounded-xl border border-dashed p-12 text-center font-mono text-sm text-muted-foreground">
          # this collection is empty…
        </div>
      ) : (
        <Window label="manifest.lock" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {items.map((item, index) => (
              <li key={item.app.id} className="flex items-center gap-3 px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground/45 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <PlatformBadge platform={item.app.platform} compact />
                <div className="min-w-0">
                  <Link
                    href={`/apps/${item.app.platform}/${item.app.slug}`}
                    className="block truncate font-medium transition-colors hover:text-primary"
                  >
                    {item.app.name}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.app.category_name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Window>
      )}
    </Container>
  )
}
