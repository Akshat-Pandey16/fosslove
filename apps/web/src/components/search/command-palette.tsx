"use client"

import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { api } from "@/lib/api/client"
import { useDebounce } from "@/lib/hooks/use-debounce"

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const query = useDebounce(value.trim(), 250)

  const { data, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.catalog.listApps({ q: query, size: 8 }),
    enabled: open && query.length >= 1,
    staleTime: 30_000,
  })

  const results = data?.items ?? []

  const go = (href: string) => {
    onOpenChange(false)
    setValue("")
    router.push(href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search apps"
      description="Find apps in the catalog"
    >
      <Command shouldFilter={false} className="font-mono">
        <CommandInput
          placeholder="$ search apps…"
          value={value}
          onValueChange={setValue}
          className="placeholder:text-term-lime/70"
        />
        <CommandList aria-live="polite">
          {query.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              <span className="text-term-lime">$ </span>
              type to query the catalog
              <span className="term-cursor" />
            </div>
          ) : isFetching && results.length === 0 ? (
            <div role="status" className="px-3 py-8 text-center text-sm text-muted-foreground">
              <span className="text-term-lime">$ </span>
              searching…
            </div>
          ) : results.length === 0 ? (
            <CommandEmpty>
              <span className="text-muted-foreground">! </span>no apps found
            </CommandEmpty>
          ) : (
            <CommandGroup heading="apps">
              {results.map((app) => (
                <CommandItem
                  key={app.id}
                  value={`${app.name}-${app.id}`}
                  onSelect={() => go(`/apps/${app.platform}/${app.slug}`)}
                >
                  <PlatformBadge platform={app.platform} compact />
                  <span className="font-medium text-foreground">{app.name}</span>
                  <span className="truncate text-term-cyan">~/{app.category_name}</span>
                </CommandItem>
              ))}
              <CommandItem
                value="see-all-results"
                onSelect={() => go(`/apps?q=${encodeURIComponent(query)}`)}
              >
                <Search className="text-term-lime" /> see all results for “{query}”
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
