"use client"

import { Boxes, Layers, Library, type LucideIcon, SquareTerminal, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useBuilderCount } from "@/lib/stores/builder"
import { cn } from "@/lib/utils"

const NAV: { href: string; label: string; icon: LucideIcon; deck?: boolean }[] = [
  { href: "/apps", label: "apps", icon: Boxes },
  { href: "/categories", label: "categories", icon: Layers },
  { href: "/collections", label: "collections", icon: Library },
  { href: "/builder", label: "deck", icon: SquareTerminal, deck: true },
  { href: "/account", label: "account", icon: User },
]

export function DockRail() {
  const pathname = usePathname()
  const count = useBuilderCount()

  return (
    <nav
      aria-label="Primary"
      className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r bg-card/30 py-3 lg:flex"
    >
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            title={item.label}
            className={cn(
              "group relative grid size-10 place-items-center rounded-lg transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {active ? (
              <span className="-translate-y-1/2 absolute top-1/2 left-0 h-5 w-0.5 rounded-full bg-primary" />
            ) : null}
            <item.icon className="size-5" />
            {item.deck && count > 0 ? (
              <span className="-top-0.5 -right-0.5 absolute grid size-4 place-items-center rounded-md bg-primary font-mono font-semibold text-[10px] text-primary-foreground">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
