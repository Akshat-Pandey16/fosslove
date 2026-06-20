"use client"

import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { Button } from "@/components/ui/button"
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

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const query = useDebounce(value.trim(), 250)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const { data, isFetching } = useQuery({
    queryKey: ["search", query],
    queryFn: () => api.catalog.listApps({ q: query, size: 8 }),
    enabled: open && query.length >= 1,
    staleTime: 30_000,
  })

  const results = data?.items ?? []

  const go = (href: string) => {
    setOpen(false)
    setValue("")
    router.push(href)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 w-full justify-start gap-2 text-muted-foreground sm:w-64 lg:w-80"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search apps…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search apps"
        description="Find apps in the catalog"
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search apps…" value={value} onValueChange={setValue} />
          <CommandList>
            {query.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Type to search the catalog…
              </div>
            ) : isFetching && results.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">Searching…</div>
            ) : results.length === 0 ? (
              <CommandEmpty>No apps found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Apps">
                {results.map((app) => (
                  <CommandItem
                    key={app.id}
                    value={`${app.name}-${app.id}`}
                    onSelect={() => go(`/apps/${app.id}`)}
                  >
                    <PlatformBadge platform={app.platform} compact />
                    <span className="font-medium">{app.name}</span>
                    <span className="truncate text-muted-foreground">· {app.category_name}</span>
                  </CommandItem>
                ))}
                <CommandItem
                  value="see-all-results"
                  onSelect={() => go(`/apps?q=${encodeURIComponent(query)}`)}
                >
                  <Search /> See all results for “{query}”
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
