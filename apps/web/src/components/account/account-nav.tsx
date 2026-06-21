"use client"

import { Heart, LayoutDashboard, Library, ScrollText, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/favorites", label: "Favorites", icon: Heart, exact: false },
  { href: "/account/collections", label: "Collections", icon: Library, exact: false },
  { href: "/account/history", label: "History", icon: ScrollText, exact: false },
  { href: "/account/settings", label: "Settings", icon: Settings, exact: false },
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
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
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <link.icon className="size-4" /> {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
