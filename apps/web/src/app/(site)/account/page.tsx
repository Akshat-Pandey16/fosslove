"use client"

import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Heart, Library, ScrollText } from "lucide-react"
import Link from "next/link"
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
      label: "Favorites",
      icon: Heart,
      value: favorites.data?.meta.total,
    },
    {
      href: "/account/collections",
      label: "Collections",
      icon: Library,
      value: collections.data?.meta.total,
    },
    {
      href: "/account/history",
      label: "Scripts generated",
      icon: ScrollText,
      value: history.data?.meta.total,
    },
  ]

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Welcome{user?.full_name ? `, ${user.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground">Your favorites, collections, and script history.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <card.icon className="size-5 text-primary" />
              <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <div>
              <div className="font-heading text-3xl font-bold">{card.value ?? "—"}</div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
