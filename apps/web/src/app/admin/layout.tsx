import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AdminNav } from "@/components/admin/admin-nav"
import { RequireAuth } from "@/components/auth/require-auth"
import { Logo } from "@/components/layout/logo"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth admin>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
          <div className="flex h-16 items-center gap-3 px-5">
            <Logo />
            <span className="rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground">
              admin
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link href="/">
                    <ArrowLeft /> Back to site
                  </Link>
                }
              />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 gap-8 px-5 py-8 lg:grid-cols-[200px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AdminNav />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </RequireAuth>
  )
}
