"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { MotionConfig } from "motion/react"
import { ThemeProvider } from "next-themes"
import { useEffect, useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/lib/auth/auth-provider"
import { useBuilder } from "@/lib/stores/builder"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useBuilder.persist.rehydrate()
  }, [])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <TooltipProvider delay={200}>
            <MotionConfig reducedMotion="user">
              {children}
              <Toaster richColors closeButton position="top-center" />
            </MotionConfig>
          </TooltipProvider>
        </AuthProvider>
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
