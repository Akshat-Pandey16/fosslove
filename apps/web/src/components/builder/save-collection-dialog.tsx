"use client"

import { Bookmark, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import { useAuth } from "@/lib/auth/auth-provider"

export function SaveCollectionDialog({ appIds }: { appIds: number[] }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        render={
          <Link href="/login?next=/builder">
            <Bookmark /> Save as collection
          </Link>
        }
      />
    )
  }

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Give your collection a name")
      return
    }
    setLoading(true)
    try {
      const collection = await api.collections.create({
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
        app_ids: appIds,
      })
      toast.success("Collection saved")
      setOpen(false)
      setName("")
      setDescription("")
      router.push(`/account/collections/${collection.id}`)
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
          <Button variant="outline" size="sm">
            <Bookmark /> Save as collection
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as collection</DialogTitle>
          <DialogDescription>Save these {appIds.length} apps as a reusable bundle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My dev setup"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-description">Description</Label>
            <Textarea
              id="collection-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="collection-public">Make public</Label>
            <Switch id="collection-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            Save collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
