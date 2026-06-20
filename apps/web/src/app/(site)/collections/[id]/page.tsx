import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddCollectionToBuilder } from "@/components/builder/add-collection-to-builder"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import type { CollectionDetail } from "@/lib/api/types"
import { PLATFORM_LABELS, PLATFORMS } from "@/lib/constants"

export const dynamic = "force-dynamic"

async function loadCollection(idParam: string): Promise<CollectionDetail> {
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    notFound()
  }
  try {
    return await api.collections.get(id)
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
    const collection = await api.collections.get(Number(id))
    return { title: collection.name, description: collection.description ?? `${collection.name} collection.` }
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
      <div>
        <Link
          href="/collections"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Public collections
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{collection.name}</h1>
        {collection.description ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">{collection.description}</p>
        ) : null}
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {collection.item_count} app{collection.item_count === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4">
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
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          This collection is empty.
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.app.id} className="flex items-center gap-3 p-4">
              <PlatformBadge platform={item.app.platform} compact />
              <div className="min-w-0">
                <Link
                  href={`/apps/${item.app.id}`}
                  className="block truncate font-medium transition-colors hover:text-primary"
                >
                  {item.app.name}
                </Link>
                <span className="text-xs text-muted-foreground">{item.app.category_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  )
}
