"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

const GOTO: Record<string, string> = {
  h: "/",
  a: "/apps",
  c: "/categories",
  o: "/collections",
  d: "/builder",
  u: "/account",
  s: "/account/settings",
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) {
    return false
  }
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
}

export function KeyboardLayer() {
  const router = useRouter()
  const pending = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const clearPending = () => {
      pending.current = false
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) {
        return
      }
      if (pending.current) {
        const dest = GOTO[event.key.toLowerCase()]
        clearPending()
        if (dest) {
          event.preventDefault()
          router.push(dest)
        }
        return
      }
      if (event.key === "g") {
        pending.current = true
        timer.current = setTimeout(clearPending, 1200)
        return
      }
      if (event.key === "?") {
        event.preventDefault()
        toast("Keyboard shortcuts", {
          description: "g then a · c · o · d · u · s  —  ⌘K to search",
          duration: 4500,
        })
      }
    }

    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearPending()
    }
  }, [router])

  return null
}
