"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { PlatformBadge } from "@/components/catalog/platform-badge"
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Apps</h1>
          <p className="text-muted-foreground">
            Every app in the catalog, including inactive ones.
          </p>
        </div>
        <Button
          render={
            <Link href="/admin/apps/new">
              <Plus /> New app
            </Link>
          }
        />
      </header>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-destructive">
                  Failed to load apps. Please retry.
                </TableCell>
              </TableRow>
            ) : data && data.items.length > 0 ? (
              data.items.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>
                    <PlatformBadge platform={app.platform} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{app.category_name}</TableCell>
                  <TableCell>
                    <span
                      className={
                        app.is_active
                          ? "inline-flex items-center rounded-md border border-primary/30 px-2 py-0.5 text-xs text-primary"
                          : "inline-flex items-center rounded-md border px-2 py-0.5 text-xs text-muted-foreground"
                      }
                    >
                      {app.is_active ? "Active" : "Inactive"}
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
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No apps yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
