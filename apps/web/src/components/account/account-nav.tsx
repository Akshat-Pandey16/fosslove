"use client"

import { Heart, LayoutDashboard, Library, ScrollText, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/account", label: "overview", icon: LayoutDashboard, exact: true },
  { href: "/account/favorites", label: "favorites", icon: Heart, exact: false },
  { href: "/account/collections", label: "collections", icon: Library, exact: false },
  { href: "/account/history", label: "history", icon: ScrollText, exact: false },
  { href: "/account/settings", label: "settings", icon: Settings, exact: false },
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto font-mono lg:flex-col lg:overflow-visible">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2 rounded-md px-3 py-2 text-[13px] whitespace-nowrap transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            <link.icon className="size-3.5" />
            <span className="flex items-baseline">
              <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-0")}>
                /
              </span>
              {link.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
