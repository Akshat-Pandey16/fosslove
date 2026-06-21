"use client"

import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { Window } from "@/components/deck/window"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorMessage } from "@/lib/api/errors"

type Status = "confirming" | "success" | "error" | "missing"

function ConfirmEmailChange() {
  const token = useSearchParams().get("token") ?? ""
  const [status, setStatus] = useState<Status>(token ? "confirming" : "missing")
  const [message, setMessage] = useState("")
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) {
      return
    }
    started.current = true
    api.auth
      .confirmEmailChange(token)
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error")
        setMessage(errorMessage(error))
      })
  }, [token])

  return (
    <Window
      label="~/auth/confirm-email"
      className="animate-in fade-in slide-in-from-bottom-2 duration-500"
      bodyClassName="space-y-4 p-6 text-center sm:p-8"
    >
      {status === "confirming" ? (
        <>
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Confirming…</h1>
          <p className="font-mono text-sm text-muted-foreground">
            <span className="text-muted-foreground">$ </span>
            <span className="text-foreground">email --update</span>
            <span className="term-cursor" />
          </p>
        </>
      ) : status === "success" ? (
        <>
          <CheckCircle2 className="mx-auto size-10 text-term-amber" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Email updated</h1>
          <p className="font-mono text-sm text-term-lime">
            ✓ updated — sign in again with your new email.
          </p>
          <Button className="glow-primary w-full" render={<Link href="/login">Sign in</Link>} />
        </>
      ) : (
        <>
          <XCircle className="mx-auto size-10 text-destructive" />
          <h1 className="font-heading text-2xl font-bold tracking-tight">Email change failed</h1>
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

export default function ConfirmEmailChangePage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailChange />
    </Suspense>
  )
}
