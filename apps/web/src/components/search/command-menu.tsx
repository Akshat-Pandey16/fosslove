"use client"

import { Search } from "lucide-react"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const CommandPalette = dynamic(
  () => import("./command-palette").then((mod) => mod.CommandPalette),
  { ssr: false },
)

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setLoaded(true)
        setOpen((current) => !current)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const trigger = () => {
    setLoaded(true)
    setOpen(true)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={trigger}
        className="h-9 w-full justify-start gap-2 bg-card/60 font-mono text-muted-foreground hover:border-primary/45 sm:w-64 lg:w-80"
      >
        <span className="text-term-lime">$</span>
        <Search className="size-3.5" />
        <span className="hidden sm:inline">search apps…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-primary sm:inline">
          ⌘K
        </kbd>
      </Button>
      {loaded ? <CommandPalette open={open} onOpenChange={setOpen} /> : null}
    </>
  )
}
