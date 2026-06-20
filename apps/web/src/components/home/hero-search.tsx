"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    router.push(trimmed ? `/apps?q=${encodeURIComponent(trimmed)}` : "/apps")
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search apps — Firefox, VLC, VS Code…"
          className="h-11 pl-9"
          aria-label="Search apps"
        />
      </div>
      <Button type="submit" size="lg" className="h-11">
        Search
      </Button>
    </form>
  )
}
