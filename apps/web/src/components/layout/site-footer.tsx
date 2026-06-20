import Link from "next/link"
import { Container } from "./container"
import { Logo } from "./logo"

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Catalog",
    links: [
      { href: "/apps", label: "All apps" },
      { href: "/categories", label: "Categories" },
      { href: "/collections", label: "Public collections" },
      { href: "/builder", label: "Script builder" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
      { href: "/account/favorites", label: "Favorites" },
      { href: "/account/history", label: "Script history" },
    ],
  },
  {
    title: "Platforms",
    links: [
      { href: "/apps?platform=windows", label: "Windows" },
      { href: "/apps?platform=linux", label: "Linux" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/20">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Browse free and open-source apps for Windows and Linux, then generate a ready-to-run
            install script for every package manager.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title} className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">{column.title}</h4>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t py-5">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} FOSSLove. Built with open source.</span>
          <span className="font-mono">winget · flatpak · apt · dnf · pacman · snap</span>
        </Container>
      </div>
    </footer>
  )
}
