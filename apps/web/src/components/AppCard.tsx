import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router";
import type { App, Platform } from "@/api/types";
import { hueForCategory, platformHue, platformLabel, type Hue } from "@/lib/hues";
import {
  ArrowUpRightIcon,
  Badge,
  Card,
  LinuxIcon,
  WindowsIcon,
  cx,
  type IconProps,
} from "@/ui";
import { AddToScriptButton } from "./AddToScriptButton";

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

export function AppCard({
  app,
  action,
  compact = false,
}: {
  app: App;
  action?: ReactNode;
  compact?: boolean | undefined;
}) {
  const hue = hueForCategory(app.category_slug);
  const PlatformIcon = PLATFORM_ICONS[app.platform];
  const letter = app.name.trim().charAt(0).toUpperCase() || "?";
  const summary = app.summary.trim();

  return (
    <Card interactive hue={hue} padded={false} className="group relative h-full">
      <Link
        to={`/apps/${app.platform}/${app.slug}`}
        className={cx("flex h-full flex-col rounded-xl", compact ? "p-4" : "p-5 sm:p-6")}
      >
        <div className={cx("flex items-start gap-3", action === undefined ? "pr-10" : "pr-20")}>
          <span
            aria-hidden="true"
            className={cx(
              "grid shrink-0 place-items-center rounded-md font-display leading-none",
              compact ? "size-9 text-base" : "size-10 text-lg",
              HUE_TILE[hue],
            )}
          >
            {letter}
          </span>
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <h3
              className={cx(
                "line-clamp-1 font-display leading-snug tracking-[-0.02em] text-ink",
                compact ? "text-base" : "text-lg",
              )}
            >
              {app.name}
            </h3>
            <Badge size="sm" hue={platformHue(app.platform)} icon={<PlatformIcon size={11} />}>
              {platformLabel(app.platform)}
            </Badge>
          </div>
        </div>

        {compact || summary === "" ? null : (
          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-muted">{summary}</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-5">
          <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-full", HUE_DOT[hue])} />
          <span className="min-w-0 truncate font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-faint">
            {app.category_name}
          </span>
          <ArrowUpRightIcon
            size={16}
            className="ml-auto shrink-0 text-ink-faint opacity-0 transition-all duration-200 ease-out-quint group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          />
        </div>
      </Link>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
        {action}
        <AddToScriptButton app={app} size={compact ? "sm" : "md"} />
      </div>
    </Card>
  );
}
