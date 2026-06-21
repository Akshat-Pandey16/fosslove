"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Globe, Loader2, Lock, Pencil, Trash2, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { GenerateScriptButton } from "@/components/catalog/generate-script-button"
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import type { CollectionDetail } from "@/lib/api/types"
import { PLATFORM_LABELS, PLATFORMS } from "@/lib/constants"

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => api.collections.get(id),
    enabled: Number.isInteger(id),
  })

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />
  }
  if (isError || !data) {
    return (
      <div className="space-y-4 rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">This collection could not be loaded.</p>
        <Button
          variant="outline"
          render={<Link href="/account/collections">Back to collections</Link>}
        />
      </div>
    )
  }

  return <CollectionView collection={data} />
}

function CollectionView({ collection }: { collection: CollectionDetail }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const items = [...collection.items].sort((a, b) => a.position - b.position)

  const setApps = useMutation({
    mutationFn: (ids: number[]) => api.collections.setApps(collection.id, ids),
    onSuccess: (updated) => {
      queryClient.setQueryData(["collection", collection.id], updated)
      queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: () => api.collections.remove(collection.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      toast.success("Collection deleted")
      router.push("/account/collections")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const removeItem = (appId: number) => {
    setApps.mutate(items.filter((item) => item.app.id !== appId).map((item) => item.app.id))
  }

  const platformsWithApps = PLATFORMS.filter((platform) =>
    items.some((item) => item.app.platform === platform),
  )

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/account/collections"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Collections
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-3xl font-bold tracking-tight">{collection.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                {collection.is_public ? <Globe className="size-3" /> : <Lock className="size-3" />}
                {collection.is_public ? "Public" : "Private"}
              </span>
            </div>
            {collection.description ? (
              <p className="max-w-2xl text-muted-foreground">{collection.description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <EditCollectionDialog collection={collection} />
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger
                render={
                  <Button variant="outline" size="icon" aria-label="Delete collection">
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

      {platformsWithApps.length > 0 ? (
        <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4">
          {platformsWithApps.map((platform) => (
            <GenerateScriptButton key={platform} platform={platform} collectionId={collection.id}>
              Download {PLATFORM_LABELS[platform]} script
            </GenerateScriptButton>
          ))}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">This collection is empty.</p>
          <Button variant="outline" render={<Link href="/apps">Browse apps to add</Link>} />
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.app.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PlatformBadge platform={item.app.platform} compact />
                  <div className="min-w-0">
                    <Link
                      href={`/apps/${item.app.platform}/${item.app.slug}`}
                      className="block truncate font-medium transition-colors hover:text-primary"
                    >
                      {item.app.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{item.app.category_name}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(item.app.id)}
                  disabled={setApps.isPending}
                  aria-label={`Remove ${item.app.name}`}
                >
                  <X />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

function EditCollectionDialog({ collection }: { collection: CollectionDetail }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? "")
  const [isPublic, setIsPublic] = useState(collection.is_public)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setLoading(true)
    try {
      const updated = await api.collections.update(collection.id, {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      })
      queryClient.setQueryData(["collection", collection.id], updated)
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      toast.success("Collection updated")
      setOpen(false)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Edit collection">
            <Pencil />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="edit-public">Make public</Label>
            <Switch id="edit-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
