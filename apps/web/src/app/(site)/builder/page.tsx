import type { Metadata } from "next"
import { BuilderClient } from "@/components/builder/builder-client"
import { Container } from "@/components/layout/container"

export const metadata: Metadata = {
  title: "Script builder",
  description: "Review your selected apps and download one ready-to-run install script per platform.",
}

export default function BuilderPage() {
  return (
    <Container className="py-10">
      <header className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Script builder</h1>
        <p className="max-w-2xl text-muted-foreground">
          Review your selection and download a ready-to-run install script for each platform. Your
          picks are saved in this browser.
        </p>
      </header>
      <BuilderClient />
    </Container>
  )
}
