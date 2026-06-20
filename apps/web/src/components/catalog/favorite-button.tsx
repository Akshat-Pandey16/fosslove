"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Heart } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"
import { useAuth } from "@/lib/auth/auth-provider"
import { cn } from "@/lib/utils"

export function FavoriteButton({
  appId,
  size = "icon",
  className,
}: {
  appId: number
  size?: "icon" | "sm" | "default"
  className?: string
}) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["favorites", "membership"],
    queryFn: () => api.favorites.list({ size: 100 }),
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const isFavorite = data?.items.some((app) => app.id === appId) ?? false

  const mutation = useMutation({
    mutationFn: () => (isFavorite ? api.favorites.remove(appId) : api.favorites.add(appId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] })
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.message("Sign in to save favorites")
      router.push(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    mutation.mutate()
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={className}
      onClick={handleClick}
      disabled={mutation.isPending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
    >
      <Heart className={cn("size-4", isFavorite && "fill-destructive text-destructive")} />
      {size === "icon" ? null : isFavorite ? "Favorited" : "Favorite"}
    </Button>
  )
}
