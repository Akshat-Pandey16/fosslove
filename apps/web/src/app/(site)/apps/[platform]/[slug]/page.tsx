import { ArrowLeft, ExternalLink, Scale } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddToBuilderButton } from "@/components/catalog/add-to-builder-button"
import { FavoriteButton } from "@/components/catalog/favorite-button"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { ManagerBadge } from "@/components/catalog/manager-badge"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { Window } from "@/components/deck/window"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import type { AppDetail, Platform } from "@/lib/api/types"
import { formatDate, MANAGER_LABELS, PLATFORM_LABELS, scriptFilename } from "@/lib/constants"

export const revalidate = 300

function parsePlatform(value: string): Platform {
  if (value !== "windows" && value !== "linux") {
    notFound()
  }
  return value
}

async function loadApp(platform: Platform, slug: string): Promise<AppDetail> {
  try {
    return await api.catalog.getAppBySlug(platform, slug, { next: { revalidate } })
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
  params: Promise<{ platform: string; slug: string }>
}): Promise<Metadata> {
  const { platform, slug } = await params
  try {
    const app = await api.catalog.getAppBySlug(parsePlatform(platform), slug, {
      next: { revalidate },
    })
    const description =
      app.summary ?? `Install ${app.name} on ${PLATFORM_LABELS[app.platform]} with FOSSLove.`
    const canonical = `/apps/${app.platform}/${app.slug}`
    return {
      title: app.name,
      description,
      alternates: { canonical },
      openGraph: { title: app.name, description, url: canonical, type: "website" },
      twitter: { title: app.name, description },
    }
  } catch {
    return { title: "App" }
  }
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ platform: string; slug: string }>
}) {
  const { platform, slug } = await params
  const app = await loadApp(parsePlatform(platform), slug)
  const refs = [...app.package_refs].sort((a, b) => a.priority - b.priority)
  const file = scriptFilename(app.platform)

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" /> ~/apps
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-muted-foreground/60">{app.platform}</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-term-cyan">{app.slug}</span>
      </div>

      <div className="grid gap-10 @4xl:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <PlatformBadge platform={app.platform} />
              <Link
                href={`/categories/${app.category_slug}`}
                className="font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                ~/categories/{app.category_slug}
              </Link>
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight">{app.name}</h1>
            {app.summary ? (
              <p className="max-w-2xl text-lg text-muted-foreground text-pretty">{app.summary}</p>
            ) : null}
          </header>

          <section className="space-y-4">
            <div className="space-y-1.5">
              <span className="font-mono text-xs text-primary/80">~/package-sources</span>
              <h2 className="font-heading text-2xl font-bold tracking-tight">Install manifest</h2>
              <p className="text-sm text-muted-foreground">
                The installer tries these in order and uses the first available on your system.
              </p>
            </div>
            <Window label={file} glow>
              <div className="bg-scanlines -m-4 p-4 font-mono text-[13px] leading-relaxed sm:text-sm">
                <div className="mb-3 text-muted-foreground/70">
                  # resolve sources for {app.slug} · {app.platform}
                </div>
                {refs.length === 0 ? (
                  <div className="text-muted-foreground/45">
                    # no package references configured yet…
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {refs.map((ref, index) => (
                      <div key={ref.id} className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground/45 tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-term-lime">→</span>
                        <ManagerBadge manager={ref.manager} />
                        <code className="text-term-cyan">{ref.identifier}</code>
                        <span className="text-muted-foreground/60">
                          {MANAGER_LABELS[ref.manager]}
                        </span>
                        {ref.install_args ? (
                          <code className="ml-auto text-muted-foreground/70">
                            {ref.install_args}
                          </code>
                        ) : null}
                      </div>
                    ))}
                    <div className="pt-2 text-term-amber">
                      ✓ {refs.length} source{refs.length === 1 ? "" : "s"} resolved · fallback chain
                      ready
                    </div>
                  </div>
                )}
              </div>
            </Window>
          </section>

          {app.description ? (
            <section className="space-y-3">
              <span className="font-mono text-xs text-primary/80">~/about</span>
              <h2 className="font-heading text-2xl font-bold tracking-tight">About {app.name}</h2>
              <p className="whitespace-pre-line text-muted-foreground text-pretty">
                {app.description}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 @4xl:sticky @4xl:top-6 @4xl:self-start">
          <div className="panel space-y-3 rounded-xl p-5">
            <span className="font-mono text-[11px] text-muted-foreground">
              $ deck add {app.slug}
            </span>
            <AddToBuilderButton app={app} size="default" className="w-full" />
            <GenerateScriptButton
              platform={app.platform}
              appIds={[app.id]}
              variant="outline"
              className="w-full"
            >
              Get install script
            </GenerateScriptButton>
            <FavoriteButton appId={app.id} size="default" className="w-full" />
          </div>

          <dl className="panel space-y-3 rounded-xl p-5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="font-mono text-xs text-muted-foreground">platform</dt>
              <dd className="font-mono text-xs text-foreground">{PLATFORM_LABELS[app.platform]}</dd>
            </div>
            {app.license ? (
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <Scale className="size-3.5" /> license
                </dt>
                <dd className="font-mono text-xs text-foreground">{app.license}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <dt className="font-mono text-xs text-muted-foreground">updated</dt>
              <dd className="font-mono text-xs text-foreground">{formatDate(app.updated_at)}</dd>
            </div>
            {app.homepage_url ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-0 font-mono text-xs text-muted-foreground hover:text-primary"
                render={
                  <a href={app.homepage_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink /> Visit homepage
                  </a>
                }
              />
            ) : null}
          </dl>
        </aside>
      </div>
    </Container>
  )
}
