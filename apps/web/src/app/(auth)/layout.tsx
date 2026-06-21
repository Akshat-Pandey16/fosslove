import { Logo } from "@/components/layout/logo"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />
      <div className="bg-grid mask-radial pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div
        aria-hidden
        className="hero-aura -z-10 pointer-events-none absolute inset-x-0 top-0 h-[420px]"
      />
      <header className="flex items-center justify-between p-5">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span>~/auth</span>
            <span className="flex items-center gap-2">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-term-lime" />
              secure session
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
