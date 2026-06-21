import { Terminal } from "lucide-react"
import type { Metadata } from "next"
import { BuilderClient } from "@/components/builder/builder-client"
import { SectionHeading } from "@/components/deck/section-heading"
import { Container } from "@/components/layout/container"

export const metadata: Metadata = {
  title: "Script builder",
  description:
    "Review your selected apps and download one ready-to-run install script per platform.",
}

export default function BuilderPage() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-50" />
      <Container className="relative py-10 lg:py-14">
        <div className="mb-8 flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Terminal className="size-3.5 text-primary" /> fosslove://deck
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-term-lime" />
            compile install script
          </span>
        </div>
        <SectionHeading
          tag="~/deck"
          title="Command deck"
          description="Review the apps loaded into your deck and compile a single, ready-to-run install script per platform. Your picks persist in this browser."
        />
        <div className="mt-8">
          <BuilderClient />
        </div>
      </Container>
    </section>
  )
}
