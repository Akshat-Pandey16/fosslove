import { ArrowUpRight, Globe } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api/client"
import { safe } from "@/lib/api/safe"
import type { Collection, Page } from "@/lib/api/types"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Public collections",
  description: "Curated, shareable bundles of open-source apps.",
  alternates: { canonical: "/collections" },
}

const EMPTY: Page<Collection> = { items: [], meta: { page: 1, size: 0, total: 0, pages: 0 } }

export default async function PublicCollectionsPage() {
  const collections = await safe(
    api.collections.listPublic({ size: 60 }, { next: { revalidate } }),
    EMPTY,
  )

  return (
    <Container className="space-y-8 py-10">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Public collections</h1>
        <p className="text-muted-foreground">
          Curated bundles shared by the community — install a whole setup in one go.
        </p>
      </header>

      {collections.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No public collections yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.items.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-heading text-lg font-semibold transition-colors group-hover:text-primary">
                  {collection.name}
                </h2>
                <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              {collection.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {collection.description}
                </p>
              ) : null}
              <div className="mt-auto flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Globe className="size-3" /> {collection.item_count} app
                {collection.item_count === 1 ? "" : "s"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  )
}
