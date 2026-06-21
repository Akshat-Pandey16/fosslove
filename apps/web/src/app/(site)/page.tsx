import { ArrowRight, ArrowUpRight, Boxes, Command, Cpu, Layers, Terminal } from "lucide-react"
import Link from "next/link"
import { AppGrid } from "@/components/catalog/app-grid"
import { SectionHeading } from "@/components/deck/section-heading"
import { DeckConsole } from "@/components/home/deck-console"
import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { safe } from "@/lib/api/safe"
import type { AppListItem, Category, Page } from "@/lib/api/types"

export const revalidate = 300

const EMPTY_CATEGORIES: Page<Category> = {
  items: [],
  meta: { page: 1, size: 0, total: 0, pages: 0 },
}
const EMPTY_APPS: Page<AppListItem> = { items: [], meta: { page: 1, size: 0, total: 0, pages: 0 } }

const STEPS = [
  {
    no: "01",
    cmd: "fosslove browse",
    title: "Scan the catalog",
    body: "Search hundreds of free, open-source apps for Windows and Linux — segregated by category, searchable instantly.",
  },
  {
    no: "02",
    cmd: "deck add <app>",
    title: "Load your deck",
    body: "Tap apps into your deck. The selection follows you across the whole catalog and persists between visits.",
  },
  {
    no: "03",
    cmd: "compile → install.sh",
    title: "Compile one script",
    body: "Download a single script that auto-detects the right package manager for every app and installs the lot.",
  },
]

export default async function HomePage() {
  const [categories, apps] = await Promise.all([
    safe(api.catalog.listCategories({ size: 8 }, { next: { revalidate } }), EMPTY_CATEGORIES),
    safe(api.catalog.listApps({ size: 24 }, { next: { revalidate } }), EMPTY_APPS),
  ])

  const appCount = apps.meta.total
  const categoryCount = categories.meta.total
  const freshApps = apps.items.slice(0, 12)
  const deckApps = apps.items.map((app) => ({
    id: app.id,
    name: app.name,
    slug: app.slug,
    category: app.category_name,
  }))

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid mask-radial pointer-events-none absolute inset-0 opacity-70" />
        <div
          aria-hidden
          className="hero-aura -z-10 pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        />
        <Container className="py-14 lg:py-20">
          <div className="mb-8 flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Terminal className="size-3.5 text-primary" /> fosslove://deck
            </span>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-term-lime" />
              {appCount > 0 ? `${appCount} modules online` : "catalog online"}
            </span>
          </div>

          <div className="grid items-start gap-10 xl:grid-cols-[1.04fr_1fr] xl:gap-12">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
                <Layers className="size-3.5 text-term-cyan" />
                {categoryCount > 0 ? `${categoryCount} categories` : "open-source catalog"} ·
                Windows &amp; Linux
              </span>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Install the open-source apps you <span className="text-glow">love</span>, in one
                command.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground text-pretty">
                FOSSLove is a command deck for free software. Load the apps you want into your deck
                and compile a single, ready-to-run install script — winget, Flatpak, APT, and more,
                picked automatically.
              </p>
              <div className="w-full max-w-md rounded-lg border bg-card/60 px-4 py-3 font-mono text-sm backdrop-blur">
                <span className="text-muted-foreground">$ </span>
                <span className="text-term-lime">fosslove</span>
                <span className="text-foreground"> build </span>
                <span className="text-term-cyan">--platform linux</span>
                <span className="term-cursor" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="glow-primary gap-2"
                  render={
                    <Link href="/apps">
                      Browse catalog <ArrowRight className="size-4" />
                    </Link>
                  }
                />
                <Button
                  size="lg"
                  variant="outline"
                  render={
                    <Link href="/builder">
                      <Boxes className="size-4" /> Open builder
                    </Link>
                  }
                />
                <span className="hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:flex">
                  <Command className="size-3.5" />K to search
                </span>
              </div>
            </div>

            <Reveal>
              <DeckConsole apps={deckApps} />
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-b bg-card/30">
        <Container>
          <div className="grid grid-cols-2 divide-x divide-y divide-border border-x border-border md:grid-cols-4 md:divide-y-0">
            <Stat
              icon={Boxes}
              value={appCount > 0 ? String(appCount) : "—"}
              label="apps catalogued"
            />
            <Stat
              icon={Layers}
              value={categoryCount > 0 ? String(categoryCount) : "—"}
              label="categories"
            />
            <Stat icon={Cpu} value="6" label="package managers" />
            <Stat icon={Terminal} value="2" label="platforms" />
          </div>
        </Container>
      </section>

      {categories.items.length > 0 ? (
        <section className="border-b py-16">
          <Container className="space-y-8">
            <SectionHeading
              tag="~/categories"
              title="Browse by module"
              action={{ href: "/categories", label: "All categories" }}
            />
            <Reveal className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
              {categories.items.map((category) => (
                <ModuleCard key={category.id} category={category} />
              ))}
            </Reveal>
          </Container>
        </section>
      ) : null}

      <section className="border-b py-16">
        <Container className="space-y-8">
          <SectionHeading
            tag="~/catalog/recent"
            title="Fresh in the catalog"
            action={{ href: "/apps", label: "View all apps" }}
          />
          <Reveal>
            <AppGrid
              apps={freshApps}
              emptyMessage="The catalog is being prepared. Check back soon."
            />
          </Reveal>
        </Container>
      </section>

      <section className="py-16">
        <Container className="space-y-10">
          <SectionHeading tag="~/manual" title="Three commands to a fresh machine" />
          <Reveal className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.no}
                className="group relative overflow-hidden rounded-xl border bg-card/40 p-6 transition-all hover:-translate-y-0.5 hover:border-term-lime/40"
              >
                <div className="bg-grid-sm pointer-events-none absolute inset-0 opacity-40" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground/60">{step.no}</span>
                    <span className="rounded border border-border px-1.5 py-0.5 text-term-cyan">
                      $ {step.cmd}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>
    </div>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Boxes; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <Icon className="size-5 text-primary/80" />
      <div>
        <div className="font-heading text-2xl font-bold">{value}</div>
        <div className="font-mono text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

function ModuleCard({ category }: { category: Category }) {
  const count = category.windows_app_count + category.linux_app_count
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="hover-lift-glow group overflow-hidden rounded-xl border bg-card/40"
    >
      <div className="flex items-center gap-1.5 border-b bg-secondary/30 px-3 py-2">
        <span className="size-2 rounded-full bg-muted-foreground/30" />
        <span className="size-2 rounded-full bg-muted-foreground/30" />
        <span className="ml-1 truncate font-mono text-[11px] text-muted-foreground">
          {category.slug}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading font-semibold transition-colors group-hover:text-primary">
            {category.name}
          </h3>
          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <span className="font-mono text-xs text-muted-foreground">{count} apps</span>
      </div>
    </Link>
  )
}
