"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus } from "lucide-react"
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

export function CreateCollectionDialog() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Give your collection a name")
      return
    }
    if (trimmedName.length > 120) {
      toast.error("Name must be 120 characters or fewer")
      return
    }
    setLoading(true)
    try {
      const collection = await api.collections.create({
        name: trimmedName,
        description: description.trim() || null,
        is_public: isPublic,
        app_ids: [],
      })
      await queryClient.invalidateQueries({ queryKey: ["collections"] })
      toast.success("Collection created")
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
          <Button>
            <Plus /> New collection
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Create a bundle, then add apps to it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-collection-name">Name</Label>
            <Input
              id="new-collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My dev setup"
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-collection-description">Description</Label>
            <Textarea
              id="new-collection-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
              maxLength={2000}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="new-collection-public">Make public</Label>
            <Switch id="new-collection-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
