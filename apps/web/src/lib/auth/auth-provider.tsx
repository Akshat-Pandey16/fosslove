"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, use, useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api/client"
import type { LoginPayload, RegisterPayload, User } from "@/lib/api/types"
import { tokenStore } from "@/lib/auth/tokens"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (data: LoginPayload) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHasToken(Boolean(tokenStore.getAccess()))
    setHydrated(true)
    return tokenStore.subscribe(() => setHasToken(Boolean(tokenStore.getAccess())))
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ["me", hasToken],
    queryFn: () => api.users.me(),
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const login = useCallback(
    async (payload: LoginPayload) => {
      const pair = await api.auth.login(payload)
      tokenStore.set(pair)
      setHasToken(true)
      await queryClient.invalidateQueries({ queryKey: ["me"] })
    },
    [queryClient],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await api.auth.register(payload)
      await login({ email: payload.email, password: payload.password })
    },
    [login],
  )

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh()
    tokenStore.clear()
    setHasToken(false)
    queryClient.removeQueries({ queryKey: ["me"] })
    if (refresh) {
      try {
        await api.auth.logout(refresh)
      } catch {
        // best-effort revocation; local tokens are already cleared
      }
    }
  }, [queryClient])

  const user = hasToken ? (data ?? null) : null

  const value: AuthContextValue = {
    user,
    isLoading: !hydrated || (hasToken && isLoading),
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>")
  }
  return context
}
