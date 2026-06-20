import { ArrowRight, Boxes, Download, MousePointerClick, Search, Terminal } from "lucide-react"
import Link from "next/link"
import { AppGrid } from "@/components/catalog/app-grid"
import { HeroSearch } from "@/components/home/hero-search"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { safe } from "@/lib/api/safe"
import type { Category, Page } from "@/lib/api/types"

export const dynamic = "force-dynamic"

const EMPTY_CATEGORIES: Page<Category> = {
  items: [],
  meta: { page: 1, size: 0, total: 0, pages: 0 },
}

const STEPS = [
  {
    icon: Search,
    title: "Browse the catalog",
    body: "Search hundreds of free, open-source apps for Windows and Linux, organised by category.",
  },
  {
    icon: MousePointerClick,
    title: "Add to your builder",
    body: "Pick the apps you want. Your selection follows you across the whole catalog.",
  },
  {
    icon: Download,
    title: "Generate one script",
    body: "Download a single install script that picks the best package manager for every app.",
  },
]

export default async function HomePage() {
  const [categories, apps] = await Promise.all([
    safe(api.catalog.listCategories({ size: 6 }), EMPTY_CATEGORIES),
    safe(api.catalog.listApps({ size: 10 }), {
      items: [],
      meta: { page: 1, size: 0, total: 0, pages: 0 },
    }),
  ])

  const appCount = apps.meta.total
  const categoryCount = categories.meta.total

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b">
        <div className="-z-10 absolute inset-0 bg-grid mask-fade-b opacity-60" />
        <div className="-z-10 absolute top-1/2 left-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              {appCount > 0 ? `${appCount}+ apps` : "Open-source catalog"} · Windows & Linux
            </span>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Install the open-source apps you <span className="text-gradient">love</span> — in one
              script.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground text-pretty">
              FOSSLove is a curated catalog of free software. Pick what you want and download a
              ready-to-run install script that uses winget, Flatpak, APT, and more — automatically.
            </p>
            <HeroSearch />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                render={
                  <Link href="/apps">
                    Browse catalog <ArrowRight />
                  </Link>
                }
              />
              <Button
                size="lg"
                variant="outline"
                render={
                  <Link href="/builder">
                    <Boxes /> Open builder
                  </Link>
                }
              />
            </div>
          </div>
          <TerminalPreview />
        </Container>
      </section>

      <section className="border-b bg-muted/20">
        <Container className="grid grid-cols-2 gap-px overflow-hidden rounded-none md:grid-cols-4">
          <Stat value={appCount > 0 ? `${appCount}+` : "—"} label="Apps catalogued" />
          <Stat value={categoryCount > 0 ? String(categoryCount) : "—"} label="Categories" />
          <Stat value="6" label="Package managers" />
          <Stat value="2" label="Platforms" />
        </Container>
      </section>

      {categories.items.length > 0 ? (
        <section className="border-b py-16">
          <Container className="space-y-8">
            <SectionHeading
              title="Browse by category"
              action={{ href: "/categories", label: "All categories" }}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {categories.items.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="font-heading font-semibold transition-colors group-hover:text-primary">
                    {category.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {category.windows_app_count + category.linux_app_count} apps
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="border-b py-16">
        <Container className="space-y-8">
          <SectionHeading
            title="Fresh in the catalog"
            action={{ href: "/apps", label: "View all apps" }}
          />
          <AppGrid
            apps={apps.items}
            emptyMessage="The catalog is being prepared. Check back soon."
          />
        </Container>
      </section>

      <section className="py-16">
        <Container className="space-y-10">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-heading text-3xl font-bold tracking-tight">How it works</h2>
            <p className="text-muted-foreground">
              From zero to a fully provisioned machine in three steps.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative rounded-xl border bg-card p-6">
                <span className="absolute top-6 right-6 font-mono text-sm text-muted-foreground/50">
                  0{index + 1}
                </span>
                <step.icon className="size-6 text-primary" />
                <h3 className="mt-4 font-heading text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-background p-6 text-center">
      <div className="font-heading text-3xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function SectionHeading({
  title,
  action,
}: {
  title: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 className="font-heading text-3xl font-bold tracking-tight">{title}</h2>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {action.label} <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

function TerminalPreview() {
  return (
    <div className="glow-primary overflow-hidden rounded-xl border bg-card font-mono text-sm shadow-xl">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <span className="size-3 rounded-full bg-red-500/70" />
        <span className="size-3 rounded-full bg-amber-500/70" />
        <span className="size-3 rounded-full bg-emerald-500/70" />
        <span className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Terminal className="size-3.5" /> install_apps.sh
        </span>
      </div>
      <pre className="overflow-x-auto p-4 leading-relaxed text-muted-foreground">
        <code>
          <span className="text-muted-foreground/60"># FOSSLove generated installer</span>
          {"\n"}
          <span className="text-primary">detect</span> package manager… apt ✓{"\n\n"}
          <span className="text-primary">→</span> flatpak install org.mozilla.firefox{"\n"}
          <span className="text-primary">→</span> apt install vlc{"\n"}
          <span className="text-primary">→</span> flatpak install com.visualstudio.code{"\n"}
          <span className="text-primary">→</span> apt install gimp{"\n\n"}
          <span className="text-emerald-500">✓ 4/4 apps installed</span> in 38s
        </code>
      </pre>
    </div>
  )
}
