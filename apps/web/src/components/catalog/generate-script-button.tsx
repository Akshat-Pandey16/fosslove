"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import type { Platform } from "@/lib/api/types"
import { downloadBlob } from "@/lib/download"

type ButtonSize = "xs" | "sm" | "default" | "lg"
type ButtonVariant = "default" | "outline" | "secondary" | "ghost"

export function GenerateScriptButton({
  platform,
  appIds,
  collectionId,
  children,
  size = "default",
  variant = "default",
  className,
}: {
  platform: Platform
  appIds?: number[]
  collectionId?: number
  children?: React.ReactNode
  size?: ButtonSize
  variant?: ButtonVariant
  className?: string
}) {
  const [loading, setLoading] = useState(false)

  const empty = !collectionId && (!appIds || appIds.length === 0)

  const run = async () => {
    setLoading(true)
    try {
      const { filename, blob } = await api.scripts.generate({
        platform,
        app_ids: appIds,
        collection_id: collectionId,
      })
      downloadBlob(blob, filename)
      toast.success(`Downloaded ${filename}`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={run}
      disabled={loading || empty}
    >
      {loading ? <Loader2 className="animate-spin" /> : <Download />}
      {children ?? "Get install script"}
    </Button>
  )
}
