import { Link } from "react-router";
import type { Category } from "@/api/types";
import { formatCount } from "@/lib/format";
import { hueForCategory, type Hue } from "@/lib/hues";
import { ArrowUpRightIcon, Card, LinuxIcon, WindowsIcon, cx } from "@/ui";

const HUE_PANEL: Record<Hue, string> = {
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

export function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index?: number | undefined;
}) {
  const hue = hueForCategory(category.slug);
  const description = category.description.trim();

  return (
    <Card interactive hue={hue} padded={false} className="group h-full">
      <Link
        to={`/categories/${category.slug}`}
        className={cx("flex h-full flex-col gap-4 rounded-xl p-6", HUE_PANEL[hue])}
      >
        <div className="flex items-start justify-between gap-3">
          {index === undefined ? (
            <span aria-hidden="true" className={cx("size-2 rounded-full", HUE_DOT[hue])} />
          ) : (
            <span
              aria-hidden="true"
              className="font-mono text-[0.6875rem] tracking-[0.18em] opacity-60"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          <ArrowUpRightIcon
            size={18}
            className="-translate-x-1 shrink-0 opacity-0 transition-all duration-200 ease-out-quint group-hover:translate-x-0 group-hover:opacity-100"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-display text-xl leading-tight tracking-[-0.02em]">{category.name}</h3>
          {description === "" ? null : (
            <p className="line-clamp-2 text-sm leading-relaxed opacity-80">{description}</p>
          )}
        </div>

        <div className="mt-auto flex items-center gap-5 border-t border-black/5 pt-4 font-mono text-xs dark:border-white/10">
          <span className="inline-flex items-center gap-1.5">
            <WindowsIcon size={14} />
            <span className="sr-only">Windows apps:</span>
            {formatCount(category.windows_app_count)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LinuxIcon size={14} />
            <span className="sr-only">Linux apps:</span>
            {formatCount(category.linux_app_count)}
          </span>
        </div>
      </Link>
    </Card>
  );
}
