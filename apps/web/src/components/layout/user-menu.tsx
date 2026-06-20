"use client"

import { Heart, LayoutDashboard, Library, LogOut, ScrollText, Settings, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth/auth-provider"

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function UserMenu() {
  const { user, isLoading, isAuthenticated, isAdmin, logout } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return <Skeleton className="size-9 rounded-full" />
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/login">Sign in</Link>} />
        <Button size="sm" render={<Link href="/register">Sign up</Link>} />
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    toast.success("Signed out.")
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {initials(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{user.full_name ?? "Account"}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>
          <LayoutDashboard /> Overview
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/favorites" />}>
          <Heart /> Favorites
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/collections" />}>
          <Library /> Collections
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/history" />}>
          <ScrollText /> Script history
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/settings" />}>
          <Settings /> Settings
        </DropdownMenuItem>
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/admin" />}>
              <Shield /> Admin panel
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
