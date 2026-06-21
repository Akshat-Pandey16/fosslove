"use client"

import { ArrowUpRight, Check, Copy, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { Platform } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export interface DeckApp {
  id: number
  name: string
  slug: string
  category: string
}

type Tone = "cmd" | "pkg" | "cmt" | "ok" | "dim"
interface Seg {
  t: string
  tone: Tone
}
interface Line {
  segs: Seg[]
}

const TONE: Record<Tone, string> = {
  cmd: "text-term-lime",
  pkg: "text-term-cyan",
  cmt: "text-muted-foreground/70",
  ok: "text-term-amber",
  dim: "text-muted-foreground/45",
}

function hash(value: string): number {
  let h = 0
  for (const ch of value) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0
  }
  return h
}

function pascal(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join("")
}

function pickManager(
  slug: string,
  platform: Platform,
): { cmd: string; pkg: string; label: string } {
  const h = hash(slug)
  if (platform === "windows") {
    return { cmd: "winget install --id", pkg: pascal(slug), label: "winget" }
  }
  const managers = [
    { cmd: "flatpak install flathub", label: "flatpak" },
    { cmd: "sudo apt install", label: "apt" },
    { cmd: "sudo snap install", label: "snap" },
  ]
  const pick = managers[h % managers.length]
  return { cmd: pick.cmd, pkg: slug, label: pick.label }
}

function buildLines(apps: DeckApp[], platform: Platform): Line[] {
  const file = platform === "windows" ? "install_apps.ps1" : "install_apps.sh"
  const lines: Line[] = [
    { segs: [{ t: `# FOSSLove — generated installer · ${file}`, tone: "cmt" }] },
    {
      segs: [
        {
          t: `# target ${platform} · ${apps.length} app${apps.length === 1 ? "" : "s"}`,
          tone: "cmt",
        },
      ],
    },
    { segs: [{ t: "", tone: "dim" }] },
  ]

  if (apps.length === 0) {
    lines.push({ segs: [{ t: "# pick apps below to compose your install script…", tone: "dim" }] })
    return lines
  }

  const detect =
    platform === "windows" ? "winget source update … ok" : "detect package manager … apt ✓"
  lines.push({
    segs: [
      { t: "$ ", tone: "cmd" },
      { t: detect, tone: "ok" },
    ],
  })
  lines.push({ segs: [{ t: "", tone: "dim" }] })

  for (const app of apps) {
    const m = pickManager(app.slug, platform)
    lines.push({
      segs: [
        { t: "→ ", tone: "cmd" },
        { t: `${m.cmd} `, tone: "cmd" },
        { t: m.pkg, tone: "pkg" },
      ],
    })
  }

  lines.push({ segs: [{ t: "", tone: "dim" }] })
  const managers = new Set(apps.map((app) => pickManager(app.slug, platform).label)).size
  lines.push({
    segs: [
      {
        t: `✓ ready — ${apps.length} app${apps.length === 1 ? "" : "s"} · ${managers} manager${
          managers === 1 ? "" : "s"
        }`,
        tone: "ok",
      },
    ],
  })
  return lines
}

function linesToText(lines: Line[]): string {
  return lines.map((line) => line.segs.map((seg) => seg.t).join("")).join("\n")
}

const DEMO_APPS: DeckApp[] = [
  { id: -1, name: "Firefox", slug: "firefox", category: "Browsers" },
  { id: -2, name: "VLC", slug: "vlc", category: "Media" },
  { id: -3, name: "GIMP", slug: "gimp", category: "Graphics" },
  { id: -4, name: "OBS Studio", slug: "obs-studio", category: "Media" },
  { id: -5, name: "VS Code", slug: "vscode", category: "Development" },
  { id: -6, name: "Krita", slug: "krita", category: "Graphics" },
  { id: -7, name: "Inkscape", slug: "inkscape", category: "Graphics" },
  { id: -8, name: "Blender", slug: "blender", category: "3D" },
  { id: -9, name: "Thunderbird", slug: "thunderbird", category: "Mail" },
  { id: -10, name: "Audacity", slug: "audacity", category: "Audio" },
]

export function DeckConsole({ apps }: { apps: DeckApp[] }) {
  const palette = useMemo(() => (apps.length > 0 ? apps.slice(0, 10) : DEMO_APPS), [apps])
  const [platform, setPlatform] = useState<Platform>("linux")
  const [selected, setSelected] = useState<number[]>(() => palette.slice(0, 3).map((a) => a.id))
  const [revealed, setRevealed] = useState(0)
  const revealedRef = useRef(0)
  const reduced = useRef(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const selectedApps = useMemo(
    () =>
      selected
        .map((id) => palette.find((app) => app.id === id))
        .filter((app): app is DeckApp => Boolean(app)),
    [selected, palette],
  )

  const lines = useMemo(() => buildLines(selectedApps, platform), [selectedApps, platform])
  const fullText = useMemo(() => linesToText(lines), [lines])
  const total = fullText.length
  const typing = revealed < total

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  useEffect(() => {
    const scrollToEnd = () => {
      const node = bodyRef.current
      if (node) {
        node.scrollTop = node.scrollHeight
      }
    }
    if (reduced.current) {
      revealedRef.current = total
      setRevealed(total)
      scrollToEnd()
      return
    }
    if (revealedRef.current > total) {
      revealedRef.current = total
      setRevealed(total)
    }
    let frame = 0
    let active = true
    const step = () => {
      if (!active || revealedRef.current >= total) {
        return
      }
      revealedRef.current = Math.min(total, revealedRef.current + 3)
      setRevealed(revealedRef.current)
      scrollToEnd()
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => {
      active = false
      cancelAnimationFrame(frame)
    }
  }, [total])

  const toggle = (id: number) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullText)
      toast.success("Script copied to clipboard")
    } catch {
      toast.error("Couldn't copy — select and copy manually")
    }
  }

  const rendered = renderLines(lines, revealed, typing)
  const file = platform === "windows" ? "install_apps.ps1" : "install_apps.sh"

  return (
    <div className="glow-primary overflow-hidden rounded-xl border bg-card/80 backdrop-blur">
      <div className="flex items-center gap-2 border-b bg-secondary/40 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-term-amber/70" />
          <span className="size-2.5 rounded-full bg-term-lime/70" />
        </span>
        <span className="ml-2 truncate font-mono text-xs text-muted-foreground">{file}</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span
            className={cn(
              "size-1.5 rounded-full",
              typing ? "animate-pulse-dot bg-term-lime" : "bg-term-lime/60",
            )}
          />
          {typing ? "compiling" : "ready"}
        </span>
      </div>

      <div
        ref={bodyRef}
        className="bg-scanlines h-72 overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed sm:text-sm"
      >
        {rendered}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t bg-secondary/20 px-3 py-2.5">
        <div className="flex rounded-md border p-0.5">
          {(["linux", "windows"] as Platform[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={platform === value}
              onClick={() => setPlatform(value)}
              className={cn(
                "rounded px-2.5 py-1 font-mono text-xs capitalize transition-colors",
                platform === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={copy} className="gap-1.5">
          <Copy className="size-3.5" /> Copy
        </Button>
        <Button
          size="sm"
          className="ml-auto gap-1.5"
          render={
            <Link href="/builder">
              Open builder <ArrowUpRight className="size-3.5" />
            </Link>
          }
        />
      </div>

      <div className="flex flex-wrap gap-1.5 border-t bg-card px-3 py-3">
        {palette.map((app) => {
          const active = selected.includes(app.id)
          return (
            <button
              key={app.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(app.id)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs transition-all",
                active
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
              )}
            >
              {active ? (
                <Check className="size-3 text-primary" />
              ) : (
                <Plus className="size-3 opacity-60" />
              )}
              {app.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function renderLines(lines: Line[], budget: number, typing: boolean): React.ReactNode {
  let remaining = budget
  let stop = false
  const out: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nodes: React.ReactNode[] = []

    for (let s = 0; s < line.segs.length; s++) {
      const seg = line.segs[s]
      if (stop) {
        break
      }
      const take = Math.min(seg.t.length, remaining)
      const shown = seg.t.slice(0, take)
      remaining -= take
      if (shown) {
        nodes.push(
          <span key={s} className={TONE[seg.tone]}>
            {shown}
          </span>,
        )
      }
      if (take < seg.t.length) {
        stop = true
        break
      }
    }

    const isCursorLine = typing && (stop || (remaining <= 0 && i < lines.length - 1))
    out.push(
      <div
        key={i}
        className={cn("min-h-[1.4em] whitespace-pre-wrap", isCursorLine && "term-cursor")}
      >
        {nodes.length > 0 ? nodes : " "}
      </div>,
    )

    if (stop) {
      break
    }
    remaining -= 1
    if (remaining < 0) {
      remaining = 0
      if (i < lines.length - 1) {
        break
      }
    }
  }

  return out
}
