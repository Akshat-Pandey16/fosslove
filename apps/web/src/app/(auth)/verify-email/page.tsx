"use client"

import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
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
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm duration-500">
      {status === "verifying" ? (
        <>
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Verifying…</h1>
          <p className="text-sm text-muted-foreground">Confirming your email address.</p>
        </>
      ) : status === "success" ? (
        <>
          <CheckCircle2 className="mx-auto size-10 text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Email verified</h1>
          <p className="text-sm text-muted-foreground">Your account is ready to go.</p>
          <Button className="w-full" render={<Link href="/login">Sign in</Link>} />
        </>
      ) : (
        <>
          <XCircle className="mx-auto size-10 text-destructive" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Verification failed</h1>
          <p className="text-sm text-muted-foreground">
            {status === "missing" ? "This link is missing its token." : message}
          </p>
          <Button variant="outline" className="w-full" render={<Link href="/">Back home</Link>} />
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  )
}
