import { Terminal } from "lucide-react"
import { AccountNav } from "@/components/account/account-nav"
import { RequireAuth } from "@/components/auth/require-auth"
import { Window } from "@/components/deck/window"
import { Container } from "@/components/layout/container"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <section className="relative overflow-hidden">
        <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-50" />
        <Container className="relative py-12 lg:py-16">
          <div className="mb-8 flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Terminal className="size-3.5 text-primary" /> fosslove://account
            </span>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-term-lime" />
              session active
            </span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <Window label="~/account" bodyClassName="p-2">
                <AccountNav />
              </Window>
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </Container>
      </section>
    </RequireAuth>
  )
}
