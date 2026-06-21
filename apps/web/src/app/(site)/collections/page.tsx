import { ArrowUpRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { SectionHeading } from "@/components/deck/section-heading"
import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/motion/reveal"
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
      <SectionHeading
        tag="~/collections"
        title="Public collections"
        description="Curated bundles shared by the community — load a whole setup into your deck in one go."
      />

      {collections.items.length === 0 ? (
        <div className="bg-grid-sm rounded-xl border border-dashed p-12 text-center font-mono text-sm text-muted-foreground">
          # no public collections yet…
        </div>
      ) : (
        <Reveal className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
          {collections.items.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="hover-lift-glow group flex flex-col overflow-hidden rounded-xl border bg-card/40"
            >
              <div className="flex items-center gap-1.5 border-b bg-secondary/30 px-3 py-2">
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="ml-1 truncate font-mono text-[11px] text-muted-foreground">
                  {collection.slug}
                </span>
                <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h2 className="font-heading text-lg font-semibold transition-colors group-hover:text-primary">
                  {collection.name}
                </h2>
                {collection.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {collection.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center gap-1.5 pt-1 font-mono text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-term-lime" /> {collection.item_count}{" "}
                  app
                  {collection.item_count === 1 ? "" : "s"}
                </div>
              </div>
            </Link>
          ))}
        </Reveal>
      )}
    </Container>
  )
}
