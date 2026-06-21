"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { CatalogIO } from "@/components/admin/catalog-io"
import { PlatformBadge } from "@/components/catalog/platform-badge"
import { SectionHeading } from "@/components/deck/section-heading"
import { Window } from "@/components/deck/window"
import { Reveal } from "@/components/motion/reveal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import type { AppListItem } from "@/lib/api/types"

export default function AdminAppsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "apps", page],
    queryFn: () => api.admin.listApps({ page, size: 100 }),
    placeholderData: (previous) => previous,
  })
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <SectionHeading
        tag="~/admin/apps"
        title="App registry"
        description="Every app in the catalog, including inactive ones."
      />

      <div className="flex flex-wrap items-center gap-2">
        <CatalogIO />
        <Button
          className="glow-primary"
          render={
            <Link href="/admin/apps/new">
              <Plus /> New app
            </Link>
          }
        />
      </div>

      <Reveal>
        <Window label="~/admin/apps/registry.tbl" bodyClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  name
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  platform
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  category
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  status
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center font-mono text-sm text-muted-foreground"
                  >
                    loading…
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center font-mono text-sm text-destructive"
                  >
                    ! failed to load apps — please retry
                  </TableCell>
                </TableRow>
              ) : data && data.items.length > 0 ? (
                data.items.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell>
                      <PlatformBadge platform={app.platform} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {app.category_name}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          app.is_active
                            ? "inline-flex items-center gap-1.5 rounded-md border border-term-amber/30 bg-term-amber/5 px-2 py-0.5 font-mono text-xs text-term-amber"
                            : "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground"
                        }
                      >
                        <span
                          className={
                            app.is_active
                              ? "size-1.5 rounded-full bg-term-lime"
                              : "size-1.5 rounded-full bg-muted-foreground/40"
                          }
                        />
                        {app.is_active ? "active" : "inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit"
                          render={
                            <Link href={`/admin/apps/${app.id}`}>
                              <Pencil />
                            </Link>
                          }
                        />
                        <DeleteAppButton app={app} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center font-mono text-sm text-muted-foreground"
                  >
                    no apps yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Window>
      </Reveal>

      {meta && meta.pages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="font-mono text-sm text-muted-foreground">
            {page} / {meta.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function DeleteAppButton({ app }: { app: AppListItem }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const remove = useMutation({
    mutationFn: () => api.admin.deleteApp(app.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] })
      toast.success("App deleted")
      setOpen(false)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Delete">
            <Trash2 />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{app.name}”?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
