"use client"

import { ChevronRight, SquareTerminal, Trash2, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { SaveCollectionDialog } from "@/components/builder/save-collection-dialog"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
import { Button } from "@/components/ui/button"
import { PLATFORM_LABELS, PLATFORMS, scriptFilename } from "@/lib/constants"
import { useBuilder } from "@/lib/stores/builder"

const STORAGE_KEY = "fosslove.deckdock"

export function DeckDock() {
  const items = useBuilder((state) => state.items)
  const remove = useBuilder((state) => state.remove)
  const clear = useBuilder((state) => state.clear)
  const pathname = usePathname()
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "closed") {
      setOpen(false)
    }
  }, [])

  const toggle = () =>
    setOpen((current) => {
      const next = !current
      localStorage.setItem(STORAGE_KEY, next ? "open" : "closed")
      return next
    })

  if (pathname === "/builder") {
    return null
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label="Open deck panel"
        className="hidden w-9 shrink-0 flex-col items-center gap-3 border-l bg-card/30 py-3 text-muted-foreground transition-colors hover:text-foreground lg:flex"
      >
        <SquareTerminal className="size-4" />
        <span className="rotate-180 font-mono text-[11px] [writing-mode:vertical-rl]">
          deck · {items.length}
        </span>
      </button>
    )
  }

  const groups = PLATFORMS.map((platform) => ({
    platform,
    apps: items.filter((item) => item.platform === platform),
  })).filter((group) => group.apps.length > 0)

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l bg-card/30 lg:flex">
      <div className="flex items-center gap-2 border-b bg-secondary/30 px-3 py-2">
        <span className="size-1.5 rounded-full bg-term-lime" />
        <span className="font-mono text-muted-foreground text-xs">~/deck</span>
        <span className="font-mono text-primary text-xs">{items.length}</span>
        <button
          type="button"
          onClick={toggle}
          aria-label="Collapse deck panel"
          className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <SquareTerminal className="size-6 text-muted-foreground/40" />
          <p className="font-mono text-muted-foreground text-xs">
            <span className="text-muted-foreground/60">$ </span>deck add &lt;app&gt;
          </p>
          <p className="text-muted-foreground text-xs">
            Load apps from the catalog to compile a script.
          </p>
          <Button size="sm" variant="outline" render={<Link href="/apps">Browse catalog</Link>} />
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {groups.map((group) => (
              <div key={group.platform}>
                <div className="sticky top-0 border-b bg-card/85 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur">
                  {scriptFilename(group.platform)} · {group.apps.length}
                </div>
                <ul className="divide-y">
                  {group.apps.map((item) => (
                    <li key={item.id} className="group flex items-center gap-2 px-3 py-2">
                      <span aria-hidden className="font-mono text-term-lime/70 text-xs">
                        →
                      </span>
                      <Link
                        href={`/apps/${item.platform}/${item.slug}`}
                        className="min-w-0 flex-1 truncate font-mono text-xs transition-colors hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t bg-secondary/20 p-3">
            {groups.map((group) => (
              <GenerateScriptButton
                key={group.platform}
                platform={group.platform}
                appIds={group.apps.map((item) => item.id)}
                size="sm"
                className="w-full"
              >
                Compile {PLATFORM_LABELS[group.platform]}
              </GenerateScriptButton>
            ))}
            <div className="flex items-center gap-2">
              <SaveCollectionDialog appIds={items.map((item) => item.id)} />
              <Button variant="ghost" size="sm" onClick={clear} className="ml-auto">
                <Trash2 /> Clear
              </Button>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
