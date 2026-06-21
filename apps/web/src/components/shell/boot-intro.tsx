"use client"

import { useEffect, useState } from "react"

const LINES = ["booting fosslove…", "mounting catalog…", "initialising deck…", "ready ✓"]
const STORAGE_KEY = "fosslove.booted"

export function BootIntro() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      return
    }
    sessionStorage.setItem(STORAGE_KEY, "1")
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }
    setShow(true)
    const stepId = setInterval(() => setStep((current) => Math.min(LINES.length, current + 1)), 165)
    const doneId = setTimeout(() => setShow(false), 980)
    return () => {
      clearInterval(stepId)
      clearTimeout(doneId)
    }
  }, [])

  if (!show) {
    return null
  }

  return (
    <button
      type="button"
      aria-hidden
      tabIndex={-1}
      onClick={() => setShow(false)}
      className="fade-in fixed inset-0 z-[100] flex animate-in cursor-default items-center justify-center bg-background"
    >
      <div className="mask-radial bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative text-left font-mono text-sm">
        {LINES.slice(0, step).map((line, index) => (
          <div
            key={line}
            className={index === step - 1 ? "text-term-lime" : "text-muted-foreground"}
          >
            <span className="text-muted-foreground/60">$ </span>
            {line}
          </div>
        ))}
        <span className="term-cursor" />
      </div>
    </button>
  )
}
