"use client"

import { ArrowRight, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useBuilder, useBuilderCount } from "@/lib/stores/builder"

export function BuilderBar() {
  const count = useBuilderCount()
  const clear = useBuilder((state) => state.clear)
  const pathname = usePathname()

  if (count === 0 || pathname === "/builder") {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="glow-primary pointer-events-auto flex items-center gap-2 rounded-lg border bg-background/90 py-1.5 pr-1.5 pl-3 shadow-lg backdrop-blur">
        <span className="flex items-center gap-2 font-mono text-sm">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-term-lime" />
          <span className="text-term-lime">$</span>
          <span className="grid size-6 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            {count}
          </span>
          <span className="hidden text-muted-foreground sm:inline">
            app{count === 1 ? "" : "s"} on deck
          </span>
        </span>
        <Button
          size="sm"
          className="rounded-md font-mono"
          render={
            <Link href="/builder">
              Open deck <ArrowRight />
            </Link>
          }
        />
        <Button
          size="icon-sm"
          variant="ghost"
          className="rounded-md"
          onClick={clear}
          aria-label="Clear builder"
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
