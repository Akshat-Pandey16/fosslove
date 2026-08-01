import type { ReactNode } from "react";
import { Link } from "react-router";
import { Card, CheckIcon, Eyebrow, Logo, Section, cx } from "@/ui";

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
}) {
  const hasAside = aside !== undefined;

  return (
    <Section>
      <div
        className={cx(
          "mx-auto flex w-full flex-col items-center gap-14",
          hasAside
            ? "lg:max-w-5xl lg:flex-row lg:items-center lg:justify-between lg:gap-16"
            : "max-w-md",
        )}
      >
        <div className="flex w-full max-w-md flex-col">
          <Link
            to="/"
            className={cx(
              "mb-8 self-center rounded-full",
              hasAside && "lg:self-start",
            )}
          >
            <Logo size={34} />
          </Link>

          <Card padded={false} className="rounded-2xl p-8 sm:p-9">
            <div className="flex flex-col gap-3">
              <Eyebrow>{eyebrow}</Eyebrow>
              <h1 className="font-display text-[clamp(1.75rem,3.6vw,2.375rem)] leading-[1.05] tracking-[-0.03em] text-ink">
                {title}
              </h1>
              {description === undefined ? null : (
                <p className="max-w-[44ch] text-sm leading-relaxed text-ink-muted">{description}</p>
              )}
            </div>

            <div className="mt-8">{children}</div>
          </Card>

          {footer === undefined ? null : (
            <div className="mt-6 flex flex-col items-center gap-1.5 text-center text-sm text-ink-muted">
              {footer}
            </div>
          )}
        </div>

        {hasAside && (
          <div aria-hidden="true" className="hidden w-full max-w-[26rem] shrink-0 lg:block">
            {aside}
          </div>
        )}
      </div>
    </Section>
  );
}

export function AuthLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Link
      to={to}
      className={cx(
        "font-medium text-ember underline decoration-ember/30 underline-offset-4 transition-colors duration-200 hover:decoration-ember",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function AuthSuccess({
  title,
  message,
  action,
}: {
  title?: string | undefined;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span
        aria-hidden="true"
        className="inline-flex size-14 items-center justify-center rounded-2xl bg-moss-soft text-moss-ink"
      >
        <CheckIcon size={26} strokeWidth={2} />
      </span>

      <div className="flex flex-col gap-2">
        {title === undefined ? null : (
          <p className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">{title}</p>
        )}
        <p role="status" className="max-w-[40ch] text-sm leading-relaxed text-ink-muted">
          {message}
        </p>
      </div>

      {action === undefined ? null : (
        <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>
      )}
    </div>
  );
}
