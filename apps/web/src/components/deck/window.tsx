import { cn } from "@/lib/utils"

export function Window({
  label,
  toolbar,
  glow = false,
  className,
  bodyClassName,
  children,
}: {
  label?: string
  toolbar?: React.ReactNode
  glow?: boolean
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card/60 backdrop-blur",
        glow && "glow-primary",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b bg-secondary/40 px-3 py-2">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/55" />
          <span className="size-2.5 rounded-full bg-term-amber/55" />
          <span className="size-2.5 rounded-full bg-term-lime/55" />
        </span>
        {label ? (
          <span className="ml-1.5 truncate font-mono text-xs text-muted-foreground">{label}</span>
        ) : null}
        {toolbar ? <div className="ml-auto flex items-center gap-2">{toolbar}</div> : null}
      </div>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  )
}
