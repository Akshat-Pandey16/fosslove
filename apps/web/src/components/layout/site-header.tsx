"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BuilderButton } from "@/components/builder/builder-button"
import { CommandMenu } from "@/components/search/command-menu"
import { cn } from "@/lib/utils"
import { Container } from "./container"
import { Logo } from "./logo"
import { MobileNav } from "./mobile-nav"
import { NAV_LINKS } from "./nav-config"
import { ThemeToggle } from "./theme-toggle"
import { UserMenu } from "./user-menu"

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <Container className="flex h-16 items-center gap-2">
        <div className="flex items-center gap-1">
          <MobileNav />
          <Logo />
        </div>
        <nav className="ml-5 hidden items-center gap-0.5 font-mono lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group rounded-md px-3 py-2 text-[13px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-0")}>
                  /
                </span>
                {link.label.toLowerCase()}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden sm:block">
            <CommandMenu />
          </div>
          <BuilderButton />
          <ThemeToggle />
          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </Container>
      <div className="border-t p-3 sm:hidden">
        <CommandMenu />
      </div>
    </header>
  )
}
