"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Download, Loader2, Upload } from "lucide-react"
import { type ChangeEvent, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import type { AppCreatePayload } from "@/lib/api/types"
import { downloadBlob } from "@/lib/download"

const MAX_IMPORT_APPS = 500

function normalizeApps(parsed: unknown): AppCreatePayload[] | null {
  if (Array.isArray(parsed)) {
    return parsed as AppCreatePayload[]
  }
  if (parsed && typeof parsed === "object" && "apps" in parsed) {
    const apps = (parsed as { apps: unknown }).apps
    if (Array.isArray(apps)) {
      return apps as AppCreatePayload[]
    }
  }
  return null
}

export function CatalogIO() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")

  const exportCatalog = useMutation({
    mutationFn: () => api.admin.exportCatalog(),
    onSuccess: (data) => {
      downloadBlob(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        "fosslove-catalog.json",
      )
      toast.success("Catalog exported")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const importApps = useMutation({
    mutationFn: (apps: AppCreatePayload[]) => api.admin.importApps({ apps }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] })
      toast.success(`Imported ${created.length} app${created.length === 1 ? "" : "s"}`)
      setOpen(false)
      setText("")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setText(await file.text())
    event.target.value = ""
  }

  const submitImport = () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      toast.error("Invalid JSON")
      return
    }
    const apps = normalizeApps(parsed)
    if (!apps || apps.length === 0) {
      toast.error("Provide a non-empty array of apps")
      return
    }
    if (apps.length > MAX_IMPORT_APPS) {
      toast.error(`Too many apps (max ${MAX_IMPORT_APPS})`)
      return
    }
    importApps.mutate(apps)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => exportCatalog.mutate()}
        disabled={exportCatalog.isPending}
      >
        {exportCatalog.isPending ? <Loader2 className="animate-spin" /> : <Download />}
        Export catalog
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline">
              <Upload /> Import apps
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import apps</DialogTitle>
            <DialogDescription>
              Paste catalog JSON or upload a file. Accepts a bare array, {"{ apps: [...] }"}, or a
              full export.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Upload file</Label>
              <input
                id="import-file"
                type="file"
                accept="application/json,.json"
                onChange={onFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-2.5 file:py-1 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-json">JSON</Label>
              <Textarea
                id="import-json"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder='[{ "category_id": 1, "platform": "linux", "name": "Firefox" }]'
                className="min-h-48 font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitImport} disabled={importApps.isPending}>
              {importApps.isPending ? <Loader2 className="animate-spin" /> : null}
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
