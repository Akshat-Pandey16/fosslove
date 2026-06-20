"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
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
  manager: PackageManager
  identifier: string
  install_args: string
  priority: number
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
          manager: ref.manager,
          identifier: ref.identifier,
          install_args: ref.install_args ?? "",
          priority: ref.priority,
        }))
      : [],
  )
  const [loading, setLoading] = useState(false)

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
      { manager: "winget", identifier: "", install_args: "", priority: (current.length + 1) * 10 },
    ])
  const updateRef = (index: number, patch: Partial<RefRow>) =>
    setRefs((current) => current.map((row, idx) => (idx === index ? { ...row, ...patch } : row)))
  const removeRef = (index: number) =>
    setRefs((current) => current.filter((_, idx) => idx !== index))

  const submit = async () => {
    if (!categoryId) {
      toast.error("Pick a category")
      return
    }
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
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
          <Label>Platform</Label>
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
        <Label htmlFor="app-name">Name</Label>
        <Input id="app-name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="app-summary">Summary</Label>
        <Input
          id="app-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="One-line description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="app-description">Description</Label>
        <Textarea
          id="app-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="app-homepage">Homepage URL</Label>
          <Input
            id="app-homepage"
            value={homepage}
            onChange={(event) => setHomepage(event.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="app-license">License</Label>
          <Input
            id="app-license"
            value={license}
            onChange={(event) => setLicense(event.target.value)}
          />
        </div>
      </div>

      {mode === "edit" ? (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="app-active">Active</Label>
            <p className="text-sm text-muted-foreground">
              Inactive apps are hidden from the catalog.
            </p>
          </div>
          <Switch id="app-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Package sources</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRef}>
            <Plus /> Add source
          </Button>
        </div>
        {refs.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No package sources yet. Add at least one (e.g. winget or flatpak).
          </p>
        ) : (
          <div className="space-y-3">
            {refs.map((row, index) => (
              <div
                key={index}
                className="grid items-end gap-2 rounded-lg border p-3 sm:grid-cols-[140px_1fr_1fr_80px_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Manager</Label>
                  <Select
                    items={managerItems}
                    value={row.manager}
                    onValueChange={(v) => updateRef(index, { manager: v as PackageManager })}
                  >
                    <SelectTrigger className="w-full">
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
                  <Label className="text-xs">Identifier</Label>
                  <Input
                    value={row.identifier}
                    onChange={(event) => updateRef(index, { identifier: event.target.value })}
                    placeholder="org.mozilla.firefox"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Install args</Label>
                  <Input
                    value={row.install_args}
                    onChange={(event) => updateRef(index, { install_args: event.target.value })}
                    placeholder="optional"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <Input
                    type="number"
                    value={row.priority}
                    onChange={(event) =>
                      updateRef(index, { priority: Number(event.target.value) || 0 })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRef(index)}
                  aria-label="Remove source"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={loading}>
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
