import type { ComponentType, ReactNode } from "react";
import { Link, useParams } from "react-router";
import { isPlatform, type AppDetail, type Platform } from "@/api/types";
import { useAuth } from "@/auth/useAuth";
import { FavoriteButton } from "@/components/FavoriteButton";
import { QueryBoundary } from "@/components/QueryBoundary";
import { useAppBySlug } from "@/features/catalog/hooks";
import { useFavoriteIds } from "@/features/favorites/hooks";
import { formatDate } from "@/lib/format";
import { hueForCategory, platformHue, platformLabel, type Hue } from "@/lib/hues";
import {
  Badge,
  Card,
  ChevronLeftIcon,
  CopyButton,
  ExternalLinkIcon,
  GlobeIcon,
  LinkButton,
  LinuxIcon,
  ManagerIcon,
  Section,
  Skeleton,
  SkeletonText,
  Terminal,
  TerminalIcon,
  TerminalLine,
  WindowsIcon,
  cx,
  type IconProps,
} from "@/ui";

const LAYOUT = "grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-16";

const HUE_TILE: Record<Hue, string> = {
  ember: "bg-ember-soft text-ember-ink",
  honey: "bg-honey-soft text-honey-ink",
  moss: "bg-moss-soft text-moss-ink",
  pine: "bg-pine-soft text-pine-ink",
  sky: "bg-sky-soft text-sky-ink",
  cobalt: "bg-cobalt-soft text-cobalt-ink",
  plum: "bg-plum-soft text-plum-ink",
  berry: "bg-berry-soft text-berry-ink",
};

const PLATFORM_ICONS: Record<Platform, ComponentType<IconProps>> = {
  windows: WindowsIcon,
  linux: LinuxIcon,
};

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function AppDetailSkeleton() {
  return (
    <div className={LAYOUT} aria-hidden="true">
      <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
        <Skeleton className="h-3 w-32 rounded-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 shrink-0 rounded-lg" />
          <Skeleton className="h-11 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <SkeletonText lines={2} className="max-w-[62ch]" />
      </div>

      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 flex-1 rounded-full" />
            <Skeleton className="size-10 shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40 rounded-full" />
          <div className="flex flex-col gap-4 border-t border-line pt-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <Skeleton className="h-2.5 w-16 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 lg:col-start-1 lg:row-start-2">
        <SkeletonText lines={5} className="max-w-[62ch]" />
        <Skeleton className="h-52 w-full rounded-lg" />
      </div>
    </div>
  );
}

function AppDetailBody({
  app,
  isVerified,
  isFavorite,
}: {
  app: AppDetail;
  isVerified: boolean;
  isFavorite: boolean;
}) {
  const hue = hueForCategory(app.category_slug);
  const PlatformIcon = PLATFORM_ICONS[app.platform];
  const letter = app.name.trim().charAt(0).toUpperCase() || "?";
  const summary = app.summary.trim();
  const description = app.description.trim();
  const homepage = app.homepage_url.trim();
  const license = app.license.trim();
  const sources = app.package_refs;

  const metadata: { label: string; value: ReactNode }[] = [
    { label: "License", value: license === "" ? "Unknown" : license },
    {
      label: "Category",
      value: (
        <Link
          to={`/categories/${app.category_slug}`}
          className="underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ember"
        >
          {app.category_name}
        </Link>
      ),
    },
    { label: "Platform", value: platformLabel(app.platform) },
    { label: "Updated", value: formatDate(app.updated_at) },
  ];

  return (
    <div className={LAYOUT}>
      <div className="flex flex-col lg:col-start-1 lg:row-start-1">
        <Link
          to="/apps"
          className="inline-flex w-fit items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted transition-colors duration-200 hover:text-ink"
        >
          <ChevronLeftIcon size={14} />
          Back to catalog
        </Link>

        <div className="mt-8 flex items-center gap-4 sm:gap-5">
          <span
            aria-hidden="true"
            className={cx(
              "grid size-14 shrink-0 place-items-center rounded-lg font-display text-2xl leading-none sm:size-16 sm:text-3xl",
              HUE_TILE[hue],
            )}
          >
            {letter}
          </span>
          <h1 className="min-w-0 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.03em] text-ink">
            {app.name}
          </h1>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge hue={platformHue(app.platform)} icon={<PlatformIcon size={12} />}>
            {platformLabel(app.platform)}
          </Badge>
          <Link to={`/categories/${app.category_slug}`} className="rounded-full">
            <Badge hue={hue}>{app.category_name}</Badge>
          </Link>
        </div>

        {summary === "" ? null : (
          <p className="mt-8 max-w-[62ch] text-lg leading-relaxed text-ink-muted">{summary}</p>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <Card className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <LinkButton
              to={`/scripts?app=${app.id}`}
              icon={<TerminalIcon size={17} />}
              className="flex-1"
            >
              Add to script
            </LinkButton>
            {isVerified && <FavoriteButton appId={app.id} isFavorite={isFavorite} />}
          </div>

          {homepage === "" ? null : (
            <a
              href={homepage}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2.5 text-sm text-ink-muted transition-colors duration-200 hover:text-ember"
            >
              <GlobeIcon size={16} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{hostLabel(homepage)}</span>
              <ExternalLinkIcon size={14} className="shrink-0" />
            </a>
          )}

          <dl className="flex flex-col border-t border-line">
            {metadata.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-b-0"
              >
                <dt className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                  {row.label}
                </dt>
                <dd className="min-w-0 truncate text-right text-sm text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </aside>

      <div className="flex flex-col gap-14 lg:col-start-1 lg:row-start-2">
        {description === "" ? null : (
          <div className="max-w-[62ch] whitespace-pre-line text-base leading-relaxed text-ink-muted">
            {description}
          </div>
        )}

        <section aria-labelledby="install-sources">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id="install-sources"
              className="font-display text-2xl leading-tight tracking-[-0.02em] text-ink"
            >
              Install sources
            </h2>
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint">
              {sources.length} {sources.length === 1 ? "source" : "sources"}
            </span>
          </div>

          <Terminal title={`${app.slug}.install`}>
            {sources.length === 0 ? (
              <TerminalLine prompt="#" muted>
                no install sources registered for this app yet
              </TerminalLine>
            ) : (
              <ul className="flex flex-col gap-2">
                {sources.map((ref) => {
                  const command = `${ref.manager} install ${ref.identifier}`;

                  return (
                    <li key={ref.id} className="flex items-center gap-3">
                      <ManagerIcon
                        manager={ref.manager}
                        size={16}
                        className="shrink-0 text-terminal-ink/55"
                      />
                      <code className="min-w-0 flex-1 truncate">
                        <span aria-hidden="true" className="mr-2 select-none text-ember">
                          $
                        </span>
                        {command}
                      </code>
                      <CopyButton
                        value={command}
                        variant="terminal"
                        size="sm"
                        className="shrink-0 border border-white/15 hover:border-white/35"
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Terminal>
        </section>
      </div>
    </div>
  );
}

export function AppDetailPage() {
  const { platform = "", slug = "" } = useParams();
  const { isVerified } = useAuth();

  const app = useAppBySlug(isPlatform(platform) ? platform : "linux", slug);
  const favoriteIds = useFavoriteIds(isVerified);

  const favorites = favoriteIds.data ?? [];

  return (
    <Section>
      <QueryBoundary isPending={app.isPending} error={app.error} skeleton={<AppDetailSkeleton />}>
        {app.data === undefined ? null : (
          <AppDetailBody
            app={app.data}
            isVerified={isVerified}
            isFavorite={favorites.includes(app.data.id)}
          />
        )}
      </QueryBoundary>
    </Section>
  );
}
