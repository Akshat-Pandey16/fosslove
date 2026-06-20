import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string
  href?: string
  showWordmark?: boolean
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-sm ring-1 ring-primary/30 transition-transform group-hover:-translate-y-0.5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="size-5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 7l4 5-4 5" />
          <path d="M13 17h7" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="font-heading text-lg font-semibold tracking-tight">
          FOSS<span className="text-primary">Love</span>
        </span>
      ) : null}
    </Link>
  )
}
