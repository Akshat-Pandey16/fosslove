import {
  ArrowRightIcon,
  Eyebrow,
  LinkButton,
  PackageIcon,
  Section,
  Terminal,
  TerminalLine,
} from "@/ui";

export function NotFoundPage() {
  return (
    <Section className="flex min-h-[62vh] flex-col items-center justify-center text-center">
      <Eyebrow hue="ember">error · 404</Eyebrow>

      <div className="relative isolate mt-8 flex w-full justify-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(30rem,88vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--color-ember-soft),transparent_70%)]"
        />
        <p
          aria-hidden="true"
          className="font-display text-[clamp(5.5rem,20vw,12rem)] font-bold leading-[0.8] tracking-[-0.06em] text-ember"
        >
          404
        </p>
      </div>

      <h1 className="mt-8 max-w-[22ch] font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] tracking-[-0.03em] text-ink">
        That page is not in the catalog.
      </h1>

      <Terminal title="not_found" className="mt-10 w-full max-w-xl text-left">
        <TerminalLine>fosslove find /this/page</TerminalLine>
        <TerminalLine prompt="" muted>
          No such file or directory
        </TerminalLine>
      </Terminal>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <LinkButton to="/apps" size="lg" icon={<PackageIcon size={18} />}>
          Browse the catalog
        </LinkButton>
        <LinkButton
          to="/"
          size="lg"
          variant="secondary"
          iconEnd={<ArrowRightIcon size={18} />}
        >
          Back home
        </LinkButton>
      </div>
    </Section>
  );
}
