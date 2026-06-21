"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-100">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-sm text-neutral-400">
              The application hit an unexpected error. Please try again.
            </p>
            {error.digest ? (
              <p className="font-mono text-xs text-neutral-500">{error.digest}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
