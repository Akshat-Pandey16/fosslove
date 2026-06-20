"use client"

import { Boxes } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useBuilderCount } from "@/lib/stores/builder"

export function BuilderButton() {
  const count = useBuilderCount()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      render={
        <Link href="/builder" aria-label={`Builder (${count} apps)`}>
          <Boxes />
          {count > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Link>
      }
    />
  )
}
