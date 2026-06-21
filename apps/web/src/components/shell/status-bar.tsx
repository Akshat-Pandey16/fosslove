"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useBuilderCount } from "@/lib/stores/builder"

function workspacePath(pathname: string): string {
  return pathname === "/" ? "~" : `~${pathname}`
}

export function StatusBar() {
  const pathname = usePathname()
  const count = useBuilderCount()
  const [clock, setClock] = useState("")

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="z-40 flex h-7 shrink-0 items-center gap-3 border-t bg-card/40 px-3 font-mono text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-term-lime" /> online
      </span>
      <span className="truncate text-term-cyan">{workspacePath(pathname)}</span>
      <span className="ml-auto flex items-center gap-3">
        <span className="hidden sm:inline">◇ {count} on deck</span>
        <span className="hidden text-muted-foreground/45 md:inline">
          ⌘K search · g a apps · ? help
        </span>
        <span suppressHydrationWarning className="tabular-nums">
          {clock}
        </span>
      </span>
    </footer>
  )
}
