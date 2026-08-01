import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { isApiError } from "@/api/errors";
import {
  ArrowRightIcon,
  Eyebrow,
  LinkButton,
  Logo,
  Section,
  Terminal,
  TerminalLine,
} from "@/ui";

export function RouteError() {
  const error = useRouteError();

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : isApiError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

  return (
    <div className="grain flex min-h-dvh flex-col bg-canvas text-ink">
      <div className="shell pt-8">
        <Link to="/" aria-label="FOSSLove home" className="inline-flex rounded-full">
          <Logo size={30} />
        </Link>
      </div>

      <Section className="flex flex-1 flex-col justify-center">
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <Eyebrow hue="ember">error</Eyebrow>

          <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02] tracking-[-0.03em]">
            Something went wrong
          </h1>

          <p className="max-w-[52ch] text-base leading-relaxed text-ink-muted">
            This page could not be rendered. The exact detail the app reported is below.
          </p>

          <Terminal title="stderr" className="w-full">
            <TerminalLine prompt="!">
              <span role="alert">{detail}</span>
            </TerminalLine>
          </Terminal>

          <div className="flex flex-wrap gap-3">
            <LinkButton to="/apps" iconEnd={<ArrowRightIcon size={18} />}>
              Back to the catalog
            </LinkButton>
            <LinkButton to="/" variant="secondary">
              Go home
            </LinkButton>
          </div>
        </div>
      </Section>
    </div>
  );
}
