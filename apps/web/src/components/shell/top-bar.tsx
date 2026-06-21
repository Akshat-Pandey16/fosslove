"use client"

import { Logo } from "@/components/layout/logo"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import { CommandMenu } from "@/components/search/command-menu"

export function TopBar() {
  return (
    <header className="relative z-40 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div className="flex items-center gap-1">
        <div className="lg:hidden">
          <MobileNav />
        </div>
        <Logo />
      </div>
      <div className="mx-auto hidden w-full max-w-sm sm:block">
        <CommandMenu />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
