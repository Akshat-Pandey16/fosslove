"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Window } from "@/components/deck/window"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import type {
  AppDetail,
  Category,
  PackageManager,
  PackageReferencePayload,
  Platform,
} from "@/lib/api/types"
import { MANAGER_LABELS, PACKAGE_MANAGERS, PLATFORM_LABELS, PLATFORMS } from "@/lib/constants"

interface RefRow {
  id: string
  manager: PackageManager
  identifier: string
  install_args: string
  priority: number
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function AppForm({
  mode,
  app,
  categories,
}: {
  mode: "create" | "edit"
  app?: AppDetail
  categories: Category[]
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [categoryId, setCategoryId] = useState(
    app ? String(app.category_id) : categories[0] ? String(categories[0].id) : "",
  )
  const [platform, setPlatform] = useState<Platform>(app?.platform ?? "windows")
  const [name, setName] = useState(app?.name ?? "")
  const [summary, setSummary] = useState(app?.summary ?? "")
  const [description, setDescription] = useState(app?.description ?? "")
  const [homepage, setHomepage] = useState(app?.homepage_url ?? "")
  const [license, setLicense] = useState(app?.license ?? "")
  const [isActive, setIsActive] = useState(app?.is_active ?? true)
  const [refs, setRefs] = useState<RefRow[]>(
    app
      ? app.package_refs.map((ref) => ({
          id: crypto.randomUUID(),
          manager: ref.manager,
          identifier: ref.identifier,
          install_args: ref.install_args ?? "",
          priority: ref.priority,
        }))
      : [],
  )
  const [loading, setLoading] = useState(false)
  const [homepageError, setHomepageError] = useState<string | null>(null)
  const [refErrors, setRefErrors] = useState<Record<string, string>>({})

  const categoryItems: Record<string, string> = Object.fromEntries(
    categories.map((category) => [String(category.id), category.name]),
  )
  const platformItems: Record<string, string> = Object.fromEntries(
    PLATFORMS.map((value) => [value, PLATFORM_LABELS[value]]),
  )
  const managerItems: Record<string, string> = Object.fromEntries(
    PACKAGE_MANAGERS.map((value) => [value, MANAGER_LABELS[value]]),
  )

  const addRef = () =>
    setRefs((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        manager: "winget",
        identifier: "",
        install_args: "",
        priority: (current.length + 1) * 10,
      },
    ])
  const updateRef = (id: string, patch: Partial<RefRow>) =>
    setRefs((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  const removeRef = (id: string) => setRefs((current) => current.filter((row) => row.id !== id))

  const submit = async () => {
    if (!categoryId) {
      toast.error("Pick a category")
      return
    }
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }

    const trimmedHomepage = homepage.trim()
    if (trimmedHomepage && (!isHttpUrl(trimmedHomepage) || trimmedHomepage.length > 500)) {
      setHomepageError("Enter a valid http(s) URL (max 500 characters).")
      toast.error("Homepage must be a valid URL")
      return
    }
    setHomepageError(null)

    const nextRefErrors: Record<string, string> = {}
    for (const row of refs) {
      const identifier = row.identifier.trim()
      if (!identifier) {
        continue
      }
      if (identifier.length > 500 || row.install_args.trim().length > 500) {
        nextRefErrors[row.id] = "Identifier and install args must be 500 characters or fewer."
      } else if (row.manager === "direct" && !isHttpUrl(identifier)) {
        nextRefErrors[row.id] = "Direct downloads need a valid http(s) URL."
      }
    }
    if (Object.keys(nextRefErrors).length > 0) {
      setRefErrors(nextRefErrors)
      toast.error("Fix the highlighted package sources")
      return
    }
    setRefErrors({})

    const packageRefs: PackageReferencePayload[] = refs
      .filter((row) => row.identifier.trim())
      .map((row) => ({
        manager: row.manager,
        identifier: row.identifier.trim(),
        install_args: row.install_args.trim() || null,
        priority: row.priority,
      }))

    setLoading(true)
    try {
      if (mode === "create") {
        await api.admin.createApp({
          category_id: Number(categoryId),
          platform,
          name: name.trim(),
          summary: summary.trim() || null,
          description: description.trim() || null,
          homepage_url: homepage.trim() || null,
          license: license.trim() || null,
          package_refs: packageRefs,
        })
        toast.success("App created")
      } else if (app) {
        await api.admin.updateApp(app.id, {
          category_id: Number(categoryId),
          name: name.trim(),
          summary: summary.trim() || null,
          description: description.trim() || null,
          homepage_url: homepage.trim() || null,
          license: license.trim() || null,
          is_active: isActive,
          package_refs: packageRefs,
        })
        toast.success("App updated")
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "apps"] })
      router.push("/admin/apps")
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Window label="~/admin/apps/metadata">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-mono text-xs">category</Label>
              <Select
                items={categoryItems}
                value={categoryId}
                onValueChange={(v) => setCategoryId(String(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs">platform</Label>
              <Select
                items={platformItems}
                value={platform}
                onValueChange={(v) => setPlatform(v as Platform)}
                disabled={mode === "edit"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PLATFORM_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-name" className="font-mono text-xs">
              name
            </Label>
            <Input id="app-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-summary" className="font-mono text-xs">
              summary
            </Label>
            <Input
              id="app-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="One-line description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-description" className="font-mono text-xs">
              description
            </Label>
            <Textarea
              id="app-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-homepage" className="font-mono text-xs">
                homepage_url
              </Label>
              <Input
                id="app-homepage"
                value={homepage}
                onChange={(event) => {
                  setHomepage(event.target.value)
                  if (homepageError) {
                    setHomepageError(null)
                  }
                }}
                placeholder="https://…"
                className="font-mono"
                aria-invalid={homepageError ? true : undefined}
                aria-describedby={homepageError ? "app-homepage-error" : undefined}
              />
              {homepageError ? (
                <p id="app-homepage-error" className="font-mono text-xs text-destructive">
                  {homepageError}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-license" className="font-mono text-xs">
                license
              </Label>
              <Input
                id="app-license"
                value={license}
                onChange={(event) => setLicense(event.target.value)}
              />
            </div>
          </div>

          {mode === "edit" ? (
            <div className="flex items-center justify-between rounded-lg border bg-secondary/20 p-4">
              <div>
                <Label htmlFor="app-active" className="font-mono text-xs">
                  is_active
                </Label>
                <p className="text-sm text-muted-foreground">
                  Inactive apps are hidden from the catalog.
                </p>
              </div>
              <Switch id="app-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          ) : null}
        </div>
      </Window>

      <Window
        label="~/admin/apps/package-sources.manifest"
        toolbar={
          <Button type="button" variant="outline" size="sm" onClick={addRef}>
            <Plus /> Add source
          </Button>
        }
      >
        {refs.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-secondary/20 p-4 font-mono text-xs text-muted-foreground">
            # no package sources yet — add at least one (e.g. winget or flatpak).
          </p>
        ) : (
          <div className="space-y-3">
            {refs.map((row) => {
              const error = refErrors[row.id]
              const directHint =
                row.manager === "direct" ? "https://download…" : "org.mozilla.firefox"
              return (
                <div
                  key={row.id}
                  className="grid items-end gap-2 rounded-lg border bg-secondary/20 p-3 sm:grid-cols-[140px_1fr_1fr_80px_auto]"
                >
                  <div className="space-y-1">
                    <Label htmlFor={`${row.id}-manager`} className="font-mono text-xs">
                      manager
                    </Label>
                    <Select
                      items={managerItems}
                      value={row.manager}
                      onValueChange={(v) => updateRef(row.id, { manager: v as PackageManager })}
                    >
                      <SelectTrigger id={`${row.id}-manager`} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGE_MANAGERS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {MANAGER_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`${row.id}-identifier`} className="font-mono text-xs">
                      identifier
                    </Label>
                    <Input
                      id={`${row.id}-identifier`}
                      value={row.identifier}
                      onChange={(event) => updateRef(row.id, { identifier: event.target.value })}
                      placeholder={directHint}
                      className="font-mono"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${row.id}-error` : undefined}
                    />
                    {error ? (
                      <p id={`${row.id}-error`} className="font-mono text-xs text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`${row.id}-args`} className="font-mono text-xs">
                      install_args
                    </Label>
                    <Input
                      id={`${row.id}-args`}
                      value={row.install_args}
                      onChange={(event) => updateRef(row.id, { install_args: event.target.value })}
                      placeholder="optional"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`${row.id}-priority`} className="font-mono text-xs">
                      priority
                    </Label>
                    <Input
                      id={`${row.id}-priority`}
                      type="number"
                      value={row.priority}
                      onChange={(event) =>
                        updateRef(row.id, { priority: Number(event.target.value) || 0 })
                      }
                      className="font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRef(row.id)}
                    aria-label="Remove source"
                  >
                    <Trash2 />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Window>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={loading} className="glow-primary">
          {loading ? <Loader2 className="animate-spin" /> : null}
          {mode === "create" ? "Create app" : "Save changes"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/admin/apps")}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
