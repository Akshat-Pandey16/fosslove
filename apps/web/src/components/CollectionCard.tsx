import type { ReactNode } from "react";
import { Link } from "react-router";
import type { Collection } from "@/api/types";
import { formatCount } from "@/lib/format";
import { hueForKey, type Hue } from "@/lib/hues";
import {
  ArrowUpRightIcon,
  Badge,
  Card,
  GlobeIcon,
  LayersIcon,
  LockIcon,
  cx,
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

export function CollectionCard({
  collection,
  action,
}: {
  collection: Collection;
  action?: ReactNode;
}) {
  const hue = hueForKey(collection.slug);
  const description = collection.description.trim();

  return (
    <Card interactive hue={hue} padded={false} className="group relative h-full">
      <Link to={`/collections/${collection.id}`} className="flex h-full flex-col rounded-xl p-5 sm:p-6">
        <div className={cx("flex items-start gap-3", action !== undefined && "pr-9")}>
          <span
            aria-hidden="true"
            className={cx("grid size-10 shrink-0 place-items-center rounded-md", HUE_TILE[hue])}
          >
            <LayersIcon size={18} />
          </span>
          <h3 className="line-clamp-2 font-display text-lg leading-snug tracking-[-0.02em] text-ink">
            {collection.name}
          </h3>
        </div>

        {description === "" ? null : (
          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-muted">{description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          {collection.is_public ? (
            <Badge size="sm" hue="moss" icon={<GlobeIcon size={11} />}>
              Public
            </Badge>
          ) : (
            <Badge size="sm" icon={<LockIcon size={11} />}>
              Private
            </Badge>
          )}
          <Badge size="sm">
            {formatCount(collection.item_count)} {collection.item_count === 1 ? "app" : "apps"}
          </Badge>
          <ArrowUpRightIcon
            size={16}
            className="ml-auto shrink-0 text-ink-faint opacity-0 transition-all duration-200 ease-out-quint group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          />
        </div>
      </Link>

      {action === undefined ? null : <div className="absolute right-4 top-4 z-10">{action}</div>}
    </Card>
  );
}
