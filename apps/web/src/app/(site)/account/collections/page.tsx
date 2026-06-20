"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Globe, Lock, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { CreateCollectionDialog } from "@/components/account/create-collection-dialog"
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
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import type { Collection } from "@/lib/api/types"

export default function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["collections", "mine", "list"],
    queryFn: () => api.collections.listMine({ size: 100 }),
  })

  const collections = data?.items ?? []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">Reusable bundles of apps you can script anytime.</p>
        </div>
        <CreateCollectionDialog />
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No collections yet. Create one or save your builder selection.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  )
}

function CollectionCard({ collection }: { collection: Collection }) {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const remove = useMutation({
    mutationFn: () => api.collections.remove(collection.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      toast.success("Collection deleted")
      setConfirmOpen(false)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <div className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/account/collections/${collection.id}`} className="min-w-0">
          <h2 className="truncate font-heading text-lg font-semibold transition-colors group-hover:text-primary">
            {collection.name}
          </h2>
        </Link>
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
          {collection.is_public ? <Globe className="size-3" /> : <Lock className="size-3" />}
          {collection.is_public ? "Public" : "Private"}
        </span>
      </div>
      {collection.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
      ) : null}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="font-mono text-xs text-muted-foreground">
          {collection.item_count} app{collection.item_count === 1 ? "" : "s"}
        </span>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Delete collection">
                <Trash2 />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{collection.name}”?</AlertDialogTitle>
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
      </div>
    </div>
  )
}
