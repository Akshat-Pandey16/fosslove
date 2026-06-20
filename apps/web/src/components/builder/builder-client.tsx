"use client"

import { Boxes, Trash2, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Platform } from "@/lib/api/types"
import { PLATFORM_LABELS, PLATFORMS } from "@/lib/constants"
import { useBuilder } from "@/lib/stores/builder"
import { SaveCollectionDialog } from "./save-collection-dialog"

export function BuilderClient() {
  const items = useBuilder((state) => state.items)
  const remove = useBuilder((state) => state.remove)
  const clearPlatform = useBuilder((state) => state.clearPlatform)
  const clear = useBuilder((state) => state.clear)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Boxes className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-heading text-lg font-semibold">Your builder is empty</p>
          <p className="text-sm text-muted-foreground">
            Add apps from the catalog and they'll collect here, ready to script.
          </p>
        </div>
        <Button render={<Link href="/apps">Browse the catalog</Link>} />
      </div>
    )
  }

  const groups = PLATFORMS.map((platform) => ({
    platform,
    apps: items.filter((item) => item.platform === platform),
  })).filter((group) => group.apps.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} app{items.length === 1 ? "" : "s"} selected
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
                  className="flex items-center justify-between gap-2 p-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/apps/${item.id}`}
                      className="block truncate font-medium transition-colors hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{item.category_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.name}`}
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
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b p-4">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={platform} />
          <span className="text-sm text-muted-foreground">
            {count} app{count === 1 ? "" : "s"}
          </span>
        </div>
        <Button variant="ghost" size="xs" onClick={onClear}>
          Clear
        </Button>
      </div>
      <ul className="divide-y">{children}</ul>
      <div className="border-t p-4">
        <GenerateScriptButton platform={platform} appIds={appIds} className="w-full">
          Download {PLATFORM_LABELS[platform]} script
        </GenerateScriptButton>
      </div>
    </section>
  )
}
