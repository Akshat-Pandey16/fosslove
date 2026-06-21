"use client"

import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { Window } from "@/components/deck/window"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"

type Status = "verifying" | "success" | "error" | "missing"

function VerifyEmail() {
  const token = useSearchParams().get("token") ?? ""
  const [status, setStatus] = useState<Status>(token ? "verifying" : "missing")
  const [message, setMessage] = useState("")
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) {
      return
    }
    started.current = true
    api.auth
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error")
        setMessage(errorMessage(error))
      })
  }, [token])

  return (
    <Window
      label="~/auth/verify-email"
      className="animate-in fade-in slide-in-from-bottom-2 duration-500"
      bodyClassName="space-y-4 p-6 text-center sm:p-8"
    >
      {status === "verifying" ? (
        <>
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Verifying…</h1>
          <p className="font-mono text-sm text-muted-foreground">
            <span className="text-muted-foreground">$ </span>
            <span className="text-foreground">verify --email</span>
            <span className="term-cursor" />
          </p>
        </>
      ) : status === "success" ? (
        <>
          <CheckCircle2 className="mx-auto size-10 text-term-amber" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Email verified</h1>
          <p className="font-mono text-sm text-term-lime">
            ✓ verified — your account is ready to go.
          </p>
          <Button className="glow-primary w-full" render={<Link href="/login">Sign in</Link>} />
        </>
      ) : (
        <>
          <XCircle className="mx-auto size-10 text-destructive" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Verification failed</h1>
          <p className="font-mono text-sm text-destructive">
            <span className="text-muted-foreground">! </span>
            {status === "missing" ? "token missing from this link." : message}
          </p>
          <Button variant="outline" className="w-full" render={<Link href="/">Back home</Link>} />
        </>
      )}
    </Window>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  )
}
