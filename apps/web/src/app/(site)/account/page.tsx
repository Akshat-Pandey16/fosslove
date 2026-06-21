"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, Heart, Library, ScrollText } from "lucide-react"
import Link from "next/link"
import { SectionHeading } from "@/components/deck/section-heading"
import { Reveal } from "@/components/motion/reveal"
import { api } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-provider"

export default function AccountOverviewPage() {
  const { user } = useAuth()
  const favorites = useQuery({
    queryKey: ["favorites", "count"],
    queryFn: () => api.favorites.list({ size: 1 }),
  })
  const collections = useQuery({
    queryKey: ["collections", "mine", "count"],
    queryFn: () => api.collections.listMine({ size: 1 }),
  })
  const history = useQuery({
    queryKey: ["history", "count"],
    queryFn: () => api.scripts.history({ size: 1 }),
  })

  const cards = [
    {
      href: "/account/favorites",
      slug: "~/account/favorites",
      label: "favorites",
      icon: Heart,
      value: favorites.data?.meta.total,
    },
    {
      href: "/account/collections",
      slug: "~/account/collections",
      label: "collections",
      icon: Library,
      value: collections.data?.meta.total,
    },
    {
      href: "/account/history",
      slug: "~/account/history",
      label: "scripts generated",
      icon: ScrollText,
      value: history.data?.meta.total,
    },
  ]

  return (
    <div className="space-y-8">
      <SectionHeading
        tag={`~/account · ${user?.email ?? "session"}`}
        title={`Welcome${user?.full_name ? `, ${user.full_name}` : ""}`}
        description="Your favorites, collections, and script history."
      />
      <Reveal className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="hover-lift-glow group overflow-hidden rounded-xl border bg-card/40"
          >
            <div className="flex items-center gap-1.5 border-b bg-secondary/30 px-3 py-2">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                <span className="size-2 rounded-full bg-muted-foreground/30" />
              </span>
              <span className="ml-1 truncate font-mono text-[11px] text-muted-foreground">
                {card.slug}
              </span>
              <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div className="space-y-2 p-5">
              <card.icon className="size-5 text-primary/80" />
              <div className="font-heading text-4xl font-bold tabular-nums transition-colors group-hover:text-primary">
                {card.value ?? "—"}
              </div>
              <div className="font-mono text-xs text-muted-foreground">{card.label}</div>
            </div>
          </Link>
        ))}
      </Reveal>
    </div>
  )
}
