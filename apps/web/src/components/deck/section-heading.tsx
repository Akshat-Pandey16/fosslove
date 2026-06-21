import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function SectionHeading({
  tag,
  title,
  description,
  action,
}: {
  tag?: string
  title: string
  description?: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1.5">
        {tag ? <span className="font-mono text-xs text-primary/80">{tag}</span> : null}
        <h2 className="font-heading text-3xl font-bold tracking-tight">{title}</h2>
        {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {action.label} <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}
