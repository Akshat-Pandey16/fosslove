"use client"

import { Boxes } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { AppListItem } from "@/lib/api/types"
import { useBuilder } from "@/lib/stores/builder"

export function AddCollectionToBuilder({ apps }: { apps: AppListItem[] }) {
  const add = useBuilder((state) => state.add)

  const handleClick = () => {
    for (const app of apps) {
      add(app)
    }
    toast.success(`Added ${apps.length} app${apps.length === 1 ? "" : "s"} to builder`)
  }

  return (
    <Button
      variant="outline"
      className="font-mono"
      onClick={handleClick}
      disabled={apps.length === 0}
    >
      <Boxes /> Load all to deck
    </Button>
  )
}
