import type { ComponentType } from "react";
import type { Platform, ScriptRun } from "@/api/types";
import { QueryBoundary } from "@/components/QueryBoundary";
import { useScriptHistory } from "@/features/scripts/hooks";
import { formatCount, formatDateTime, relativeTime } from "@/lib/format";
import { platformHue, platformLabel, type Hue } from "@/lib/hues";
import {
  ArrowRightIcon,
  Card,
  ClockIcon,
  EmptyState,
  LinkButton,
  LinuxIcon,
  PageHeader,
  Section,
  Skeleton,
  SkeletonList,
  TerminalIcon,
  WindowsIcon,
  cx,
  type IconProps,
} from "@/ui";

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

const HUE_DOT: Record<Hue, string> = {
  ember: "bg-ember",
  honey: "bg-honey",
  moss: "bg-moss",
  pine: "bg-pine",
  sky: "bg-sky",
  cobalt: "bg-cobalt",
  plum: "bg-plum",
  berry: "bg-berry",
};

const PLATFORM_ICONS: Record<Platform, ComponentType<IconProps>> = {
  windows: WindowsIcon,
  linux: LinuxIcon,
};

function HistoryRow({ run, connected }: { run: ScriptRun; connected: boolean }) {
  const hue = platformHue(run.platform);
  const PlatformIcon = PLATFORM_ICONS[run.platform];
  const label = platformLabel(run.platform);

  return (
    <li className="flex gap-4 sm:gap-5">
      <div aria-hidden="true" className="relative hidden w-3 shrink-0 sm:block">
        {connected && (
          <span className="absolute -bottom-4 left-1/2 top-11 w-px -translate-x-1/2 bg-line" />
        )}
        <span
          className={cx(
            "absolute left-1/2 top-11 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-canvas",
            HUE_DOT[hue],
          )}
        />
      </div>

      <Card
        padded={false}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-4 p-5"
      >
        <span
          aria-hidden="true"
          className={cx("grid size-12 shrink-0 place-items-center rounded-md", HUE_TILE[hue])}
        >
          <PlatformIcon size={22} />
        </span>

        <p className="flex items-baseline gap-2">
          <span className="font-display text-[2rem] leading-none tracking-[-0.03em] text-ink">
            {run.app_count}
          </span>
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-faint">
            {run.app_count === 1 ? "app" : "apps"}
          </span>
        </p>

        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="font-display text-base leading-snug tracking-[-0.01em] text-ink">
            {label} install script
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
            <ClockIcon size={12} className="shrink-0" />
            <time dateTime={run.created_at} title={formatDateTime(run.created_at)}>
              {relativeTime(run.created_at)}
            </time>
          </p>
        </div>

        <LinkButton
          to={`/scripts?platform=${run.platform}`}
          variant="secondary"
          size="sm"
          iconEnd={<ArrowRightIcon size={15} />}
          className="ml-auto"
        >
          Build again
          <span className="sr-only"> with {label}</span>
        </LinkButton>
      </Card>
    </li>
  );
}

function HistoryRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-6 rounded-xl border border-line bg-surface p-5 shadow-soft"
    >
      <Skeleton className="size-12 shrink-0 rounded-md" />
      <Skeleton className="h-7 w-16" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-2.5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-9 w-28 shrink-0 rounded-full" />
    </div>
  );
}

export function ScriptHistoryPage() {
  const history = useScriptHistory();
  const runs = history.data?.items ?? [];

  return (
    <Section>
      <PageHeader
        eyebrow="script history"
        title="Every script you have built."
        description="A running log of the install scripts generated from your account, newest first."
        actions={
          <LinkButton to="/scripts" icon={<TerminalIcon size={16} />}>
            New script
          </LinkButton>
        }
      />

      {history.data === undefined ? null : (
        <p className="mb-8 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
          {formatCount(history.data.meta.total)} {history.data.meta.total === 1 ? "run" : "runs"}
        </p>
      )}

      <QueryBoundary
        isPending={history.isPending}
        error={history.error}
        isEmpty={runs.length === 0}
        skeleton={
          <div className="flex flex-col gap-4">
            <SkeletonList count={4}>
              <HistoryRowSkeleton />
            </SkeletonList>
          </div>
        }
        empty={
          <EmptyState
            icon={<TerminalIcon size={24} />}
            title="No scripts yet"
            description="Build your first install script and every run will be logged here."
            action={
              <LinkButton to="/scripts" icon={<TerminalIcon size={16} />}>
                Open the script builder
              </LinkButton>
            }
          />
        }
      >
        <ol className="flex flex-col gap-4">
          {runs.map((run, index) => (
            <HistoryRow key={run.id} run={run} connected={index < runs.length - 1} />
          ))}
        </ol>
      </QueryBoundary>
    </Section>
  );
}
