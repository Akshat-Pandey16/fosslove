"use client"

import { Loader2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-provider"

export function RequireAuth({
  children,
  admin = false,
}: {
  children: React.ReactNode
  admin?: boolean
}) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) {
      return
    }
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    if (admin && !isAdmin) {
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, isAdmin, admin, router, pathname])

  if (isLoading || !isAuthenticated || (admin && !isAdmin)) {
    return (
      <div role="status" className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  return <>{children}</>
}
