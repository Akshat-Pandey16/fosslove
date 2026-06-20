import { ArrowLeft, ExternalLink, Scale } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddToBuilderButton } from "@/components/catalog/add-to-builder-button"
import { FavoriteButton } from "@/components/catalog/favorite-button"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { ManagerBadge } from "@/components/catalog/manager-badge"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import type { AppDetail } from "@/lib/api/types"
import { formatDate, MANAGER_LABELS, PLATFORM_LABELS } from "@/lib/constants"

export const dynamic = "force-dynamic"

async function loadApp(idParam: string): Promise<AppDetail> {
  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) {
    notFound()
  }
  try {
    return await api.catalog.getApp(id)
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
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const app = await api.catalog.getApp(Number(id))
    return {
      title: app.name,
      description:
        app.summary ?? `Install ${app.name} on ${PLATFORM_LABELS[app.platform]} with FOSSLove.`,
    }
  } catch {
    return { title: "App" }
  }
}

export default async function AppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = await loadApp(id)
  const refs = [...app.package_refs].sort((a, b) => a.priority - b.priority)

  return (
    <Container className="py-10">
      <Link
        href="/apps"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All apps
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <PlatformBadge platform={app.platform} />
              <Link
                href={`/categories/${app.category_id}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {app.category_name}
              </Link>
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight">{app.name}</h1>
            {app.summary ? (
              <p className="max-w-2xl text-lg text-muted-foreground text-pretty">{app.summary}</p>
            ) : null}
          </header>

          <section className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">Package sources</h2>
            <p className="text-sm text-muted-foreground">
              The installer tries these in order and uses the first available on your system.
            </p>
            <div className="divide-y rounded-xl border">
              {refs.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  No package references configured yet.
                </div>
              ) : (
                refs.map((ref) => (
                  <div key={ref.id} className="flex flex-wrap items-center gap-3 p-4">
                    <ManagerBadge manager={ref.manager} />
                    <code className="font-mono text-sm">{ref.identifier}</code>
                    <span className="text-xs text-muted-foreground">
                      {MANAGER_LABELS[ref.manager]}
                    </span>
                    {ref.install_args ? (
                      <code className="ml-auto font-mono text-xs text-muted-foreground">
                        {ref.install_args}
                      </code>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          {app.description ? (
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">About</h2>
              <p className="whitespace-pre-line text-muted-foreground text-pretty">
                {app.description}
              </p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-3 rounded-xl border bg-card p-5">
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

          <dl className="space-y-3 rounded-xl border bg-card p-5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Platform</dt>
              <dd className="font-medium">{PLATFORM_LABELS[app.platform]}</dd>
            </div>
            {app.license ? (
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Scale className="size-3.5" /> License
                </dt>
                <dd className="font-medium">{app.license}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="font-medium">{formatDate(app.updated_at)}</dd>
            </div>
            {app.homepage_url ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-0 text-muted-foreground"
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
