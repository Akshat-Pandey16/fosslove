import Link from "next/link"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <p className="font-heading text-6xl font-bold tracking-tight text-gradient">404</p>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground">We couldn't find that page.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button render={<Link href="/">Go home</Link>} />
          <Button variant="outline" render={<Link href="/apps">Browse apps</Link>} />
        </div>
      </div>
    </Container>
  )
}
