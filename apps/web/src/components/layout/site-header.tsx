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
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <Container className="flex h-16 items-center gap-2">
        <div className="flex items-center gap-1">
          <MobileNav />
          <Logo />
        </div>
        <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
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
