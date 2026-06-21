import { ArrowLeft, Terminal } from "lucide-react"
import Link from "next/link"
import { AdminNav } from "@/components/admin/admin-nav"
import { RequireAuth } from "@/components/auth/require-auth"
import { Logo } from "@/components/layout/logo"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth admin>
      <div className="relative flex min-h-screen flex-col">
        <div className="bg-grid pointer-events-none fixed inset-0 -z-10 opacity-40" />
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />
          <div className="flex h-16 items-center gap-3 px-5">
            <Logo />
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-xs text-primary">
              <Terminal className="size-3" /> command deck
            </span>
            <span className="hidden items-center gap-2 font-mono text-xs text-muted-foreground sm:flex">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-term-lime" />{" "}
              root@fosslove
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-xs"
                render={
                  <Link href="/">
                    <ArrowLeft /> exit deck
                  </Link>
                }
              />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 gap-8 px-5 py-8 lg:grid-cols-[212px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AdminNav />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </RequireAuth>
  )
}
