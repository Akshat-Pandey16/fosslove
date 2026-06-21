"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowUpRight, Globe, Lock, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { CreateCollectionDialog } from "@/components/account/create-collection-dialog"
import { SectionHeading } from "@/components/deck/section-heading"
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          tag="~/account/collections"
          title="Collections"
          description="Reusable bundles of apps you can script anytime."
        />
        <CreateCollectionDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center font-mono text-sm text-muted-foreground">
          $ no collections yet — create one or save your builder selection
        </div>
      ) : (
        <Reveal className="grid gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </Reveal>
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
    <div className="hover-lift-glow group flex flex-col overflow-hidden rounded-xl border bg-card/40">
      <div className="flex items-center gap-1.5 border-b bg-secondary/30 px-3 py-2">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          {collection.is_public ? <Globe className="size-3" /> : <Lock className="size-3" />}
          {collection.is_public ? "public" : "private"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/account/collections/${collection.id}`} className="min-w-0">
            <h2 className="truncate font-heading text-lg font-semibold transition-colors group-hover:text-primary">
              {collection.name}
            </h2>
          </Link>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
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
    </div>
  )
}
