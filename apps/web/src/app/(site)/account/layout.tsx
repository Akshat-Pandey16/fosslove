import { AccountNav } from "@/components/account/account-nav"
import { RequireAuth } from "@/components/auth/require-auth"
import { Container } from "@/components/layout/container"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </RequireAuth>
  )
}
