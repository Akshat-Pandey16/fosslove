"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import { queryKeys } from "@/lib/api/query-keys"
import type { Platform } from "@/lib/api/types"
import { useAuth } from "@/lib/auth/auth-provider"
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
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const empty = !collectionId && (!appIds || appIds.length === 0)

  const run = async () => {
    setLoading(true)
    try {
      const { filename, blob, skippedIds } = await api.scripts.generate({
        platform,
        app_ids: appIds,
        collection_id: collectionId,
      })
      downloadBlob(blob, filename)
      if (skippedIds.length > 0) {
        toast.warning(
          `Downloaded ${filename} — ${skippedIds.length} app${
            skippedIds.length === 1 ? "" : "s"
          } had no installer for ${platform} and ${skippedIds.length === 1 ? "was" : "were"} left out.`,
        )
      } else {
        toast.success(`Downloaded ${filename}`)
      }
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: queryKeys.history.all })
      }
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
