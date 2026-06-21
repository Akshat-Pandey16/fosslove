"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import type { Category } from "@/lib/api/types"

export default function AdminCategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => api.catalog.listCategories({ size: 100 }),
  })

  return (
    <div className="space-y-6">
      <SectionHeading
        tag="~/admin/categories"
        title="Category modules"
        description="Organise the catalog into categories."
      />

      <div className="flex justify-end">
        <CategoryFormDialog mode="create" />
      </div>

      <Reveal>
        <Window label="~/admin/categories/modules.tbl" bodyClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  name
                </TableHead>
                <TableHead className="font-mono text-xs text-muted-foreground uppercase">
                  slug
                </TableHead>
                <TableHead className="text-right font-mono text-xs text-muted-foreground uppercase">
                  windows
                </TableHead>
                <TableHead className="text-right font-mono text-xs text-muted-foreground uppercase">
                  linux
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
              ) : data && data.items.length > 0 ? (
                data.items.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="font-mono text-xs text-term-cyan">
                      {category.slug}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {category.windows_app_count}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {category.linux_app_count}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <CategoryFormDialog mode="edit" category={category} />
                        <DeleteCategoryButton category={category} />
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
                    no categories yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Window>
      </Reveal>
    </div>
  )
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function CategoryFormDialog({ mode, category }: { mode: "create" | "edit"; category?: Category }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(category?.name ?? "")
  const [description, setDescription] = useState(category?.description ?? "")
  const [iconUrl, setIconUrl] = useState(category?.icon_url ?? "")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Name is required")
      return
    }
    if (trimmedName.length > 100) {
      toast.error("Name must be 100 characters or fewer")
      return
    }
    const trimmedIcon = iconUrl.trim()
    if (trimmedIcon && (!isHttpUrl(trimmedIcon) || trimmedIcon.length > 500)) {
      toast.error("Icon URL must be a valid http(s) URL")
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || null,
        icon_url: trimmedIcon || null,
      }
      if (mode === "create") {
        await api.admin.createCategory(payload)
      } else if (category) {
        await api.admin.updateCategory(category.id, payload)
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      await queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success(mode === "create" ? "Category created" : "Category updated")
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
          mode === "create" ? (
            <Button className="glow-primary">
              <Plus /> New category
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" aria-label="Edit">
              <Pencil />
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono text-sm text-primary">
            {mode === "create" ? "~/admin/categories/new" : "~/admin/categories/edit"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name" className="font-mono text-xs">
              name
            </Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-description" className="font-mono text-xs">
              description
            </Label>
            <Textarea
              id="category-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-icon" className="font-mono text-xs">
              icon_url
            </Label>
            <Input
              id="category-icon"
              value={iconUrl}
              onChange={(event) => setIconUrl(event.target.value)}
              placeholder="https://…"
              className="font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteCategoryButton({ category }: { category: Category }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const remove = useMutation({
    mutationFn: () => api.admin.deleteCategory(category.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Category deleted")
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
          <AlertDialogTitle>Delete “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Categories with apps cannot be deleted. This cannot be undone.
          </AlertDialogDescription>
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
