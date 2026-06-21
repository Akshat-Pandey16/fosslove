"use client"

import { Boxes, Trash2, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { Window } from "@/components/deck/window"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import type { AppListItem, Platform } from "@/lib/api/types"
import { PLATFORM_LABELS, PLATFORMS, scriptFilename } from "@/lib/constants"
import { useBuilder } from "@/lib/stores/builder"
import { SaveCollectionDialog } from "./save-collection-dialog"

export function BuilderClient() {
  const items = useBuilder((state) => state.items)
  const remove = useBuilder((state) => state.remove)
  const clearPlatform = useBuilder((state) => state.clearPlatform)
  const reconcile = useBuilder((state) => state.reconcile)
  const clear = useBuilder((state) => state.clear)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const ids = useBuilder.getState().items.map((item) => item.id)
    if (ids.length === 0) {
      return
    }
    let cancelled = false
    Promise.allSettled(ids.map((id) => api.catalog.getApp(id))).then((results) => {
      if (cancelled) {
        return
      }
      const resolved: AppListItem[] = []
      const checked: number[] = []
      results.forEach((result, index) => {
        const id = ids[index]
        if (result.status === "fulfilled") {
          resolved.push(result.value)
          checked.push(id)
        } else if (result.reason instanceof ApiError && result.reason.status === 404) {
          checked.push(id)
        }
      })
      reconcile(resolved, checked)
    })
    return () => {
      cancelled = true
    }
  }, [reconcile])

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Window label="~/deck — empty" className="bg-card/40">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="grid size-12 place-items-center rounded-lg border bg-secondary/40 text-muted-foreground">
            <Boxes className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-heading text-lg font-semibold">Your deck is empty</p>
            <p className="font-mono text-sm text-muted-foreground">
              <span className="text-muted-foreground/60">$ </span>
              deck add &lt;app&gt; — load apps from the catalog to compile a script
            </p>
          </div>
          <Button render={<Link href="/apps">Browse the catalog</Link>} />
        </div>
      </Window>
    )
  }

  const groups = PLATFORMS.map((platform) => ({
    platform,
    apps: items.filter((item) => item.platform === platform),
  })).filter((group) => group.apps.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card/40 px-4 py-3 backdrop-blur">
        <p className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-term-lime" />
          <span className="text-term-lime">$</span> deck status —{" "}
          <span className="text-foreground">{items.length}</span> app
          {items.length === 1 ? "" : "s"} loaded
        </p>
        <div className="flex items-center gap-2">
          <SaveCollectionDialog appIds={items.map((item) => item.id)} />
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 /> Clear all
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <BuilderGroup
            key={group.platform}
            platform={group.platform}
            appIds={group.apps.map((item) => item.id)}
            count={group.apps.length}
            onClear={() => clearPlatform(group.platform)}
          >
            <AnimatePresence initial={false}>
              {group.apps.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                  className="group/row flex items-center justify-between gap-2 px-4 py-2.5 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span aria-hidden className="font-mono text-sm text-term-lime/70">
                      →
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/apps/${item.platform}/${item.slug}`}
                        className="block truncate font-mono text-sm font-medium transition-colors hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.category_name}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/row:opacity-100"
                  >
                    <X />
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </BuilderGroup>
        ))}
      </div>
    </div>
  )
}

function BuilderGroup({
  platform,
  appIds,
  count,
  onClear,
  children,
}: {
  platform: Platform
  appIds: number[]
  count: number
  onClear: () => void
  children: React.ReactNode
}) {
  return (
    <Window
      label={scriptFilename(platform)}
      bodyClassName="p-0"
      toolbar={
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-term-lime/70" />
          {count} app{count === 1 ? "" : "s"}
        </span>
      }
    >
      <div className="flex items-center justify-between gap-2 border-b bg-secondary/20 px-4 py-2.5">
        <PlatformBadge platform={platform} />
        <Button variant="ghost" size="xs" onClick={onClear}>
          Clear
        </Button>
      </div>
      <ul className="divide-y">{children}</ul>
      <div className="border-t bg-secondary/20 p-3">
        <GenerateScriptButton
          platform={platform}
          appIds={appIds}
          className="hover-lift-glow w-full"
        >
          Compile {PLATFORM_LABELS[platform]} script
        </GenerateScriptButton>
      </div>
    </Window>
  )
}
