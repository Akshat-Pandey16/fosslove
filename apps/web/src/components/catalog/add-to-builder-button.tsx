"use client"

import { Check, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { AppListItem } from "@/lib/api/types"
import { useBuilder, useInBuilder } from "@/lib/stores/builder"
import { cn } from "@/lib/utils"

type ButtonSize = "xs" | "sm" | "default" | "lg"

export function AddToBuilderButton({
  app,
  size = "sm",
  className,
}: {
  app: AppListItem
  size?: ButtonSize
  className?: string
}) {
  const inBuilder = useInBuilder(app.id)
  const toggle = useBuilder((state) => state.toggle)

  const handleClick = () => {
    toggle(app)
    if (inBuilder) {
      toast.message(`Removed ${app.name} from builder`)
    } else {
      toast.success(`Added ${app.name} to builder`)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={inBuilder ? "secondary" : "default"}
      className={cn("font-mono", inBuilder && "border border-primary/40 text-primary", className)}
      onClick={handleClick}
      aria-pressed={inBuilder}
    >
      {inBuilder ? (
        <>
          <Check /> in deck
        </>
      ) : (
        <>
          <Plus /> deck
        </>
      )}
    </Button>
  )
}
