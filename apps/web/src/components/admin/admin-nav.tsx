"use client"

import { LayoutDashboard, Package, ScrollText, Settings, Tag } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/admin", label: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/categories", label: "categories", icon: Tag, exact: false },
  { href: "/admin/apps", label: "apps", icon: Package, exact: false },
  { href: "/admin/activity", label: "activity", icon: ScrollText, exact: false },
  { href: "/admin/settings", label: "settings", icon: Settings, exact: false },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 font-mono lg:flex-col lg:overflow-visible lg:pb-0">
      <span className="hidden px-3 pb-2 text-[11px] tracking-wide text-muted-foreground/60 uppercase lg:block">
        ~/admin
      </span>
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
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <link.icon className="size-4" />
            <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-0")}>
              /
            </span>
            <span className="-ml-1">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
