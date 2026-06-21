"use client"

import Link from "next/link"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while loading this page. You can try again or head back to
            the catalog.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">{error.digest}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" render={<Link href="/apps">Browse apps</Link>} />
        </div>
      </div>
    </Container>
  )
}
