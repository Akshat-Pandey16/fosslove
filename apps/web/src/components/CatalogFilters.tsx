import type { Category } from "@/api/types";
import { PlatformFilter } from "@/components/PlatformFilter";
import { QueryBoundary } from "@/components/QueryBoundary";
import { formatCount } from "@/lib/format";
import { hueForCategory, type Hue } from "@/lib/hues";
import { Button, CloseIcon, SearchInput, Skeleton, SkeletonList, cx } from "@/ui";

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

const HUE_ACTIVE: Record<Hue, string> = {
  ember: "bg-ember-soft text-ember-ink",
  honey: "bg-honey-soft text-honey-ink",
  moss: "bg-moss-soft text-moss-ink",
  pine: "bg-pine-soft text-pine-ink",
  sky: "bg-sky-soft text-sky-ink",
  cobalt: "bg-cobalt-soft text-cobalt-ink",
  plum: "bg-plum-soft text-plum-ink",
  berry: "bg-berry-soft text-berry-ink",
};

const GROUP_LABEL = "font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint";

const PILL =
  "flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-left text-sm transition-colors duration-200 ease-out-quint";

const PILL_IDLE = "text-ink-muted hover:bg-sunken hover:text-ink";

export function CatalogFilters({
  search,
  onSearchChange,
  platform,
  onPlatformChange,
  categoryId,
  onCategoryChange,
  categories,
  categoriesPending,
  categoriesError,
  hasFilters,
  onClear,
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  platform: string;
  onPlatformChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: readonly Category[];
  categoriesPending: boolean;
  categoriesError: unknown;
  hasFilters: boolean;
  onClear: () => void;
  className?: string | undefined;
}) {
  const allCount = categories.reduce(
    (total, category) => total + category.windows_app_count + category.linux_app_count,
    0,
  );

  return (
    <div className={cx("flex flex-col gap-8", className)}>
      <div role="search" className="flex flex-col gap-3">
        <label htmlFor="catalog-search" className={GROUP_LABEL}>
          Search
        </label>
        <SearchInput
          id="catalog-search"
          name="q"
          placeholder="firefox, vlc, docker…"
          autoComplete="off"
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          onClear={() => {
            onSearchChange("");
          }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className={GROUP_LABEL}>Platform</p>
        <PlatformFilter value={platform} onChange={onPlatformChange} includeAll />
      </div>

      <div className="flex flex-col gap-3">
        <p id="catalog-category-label" className={GROUP_LABEL}>
          Category
        </p>
        <div
          role="group"
          aria-labelledby="catalog-category-label"
          className="rail-scroll -mr-2 flex max-h-[22rem] flex-col gap-1 pr-2 lg:max-h-[calc(100dvh-var(--header-h)-16rem)]"
        >
          <QueryBoundary
            isPending={categoriesPending}
            error={categoriesError}
            isEmpty={categories.length === 0}
            skeleton={
              <SkeletonList count={7}>
                <Skeleton className="h-9 w-full shrink-0 rounded-full" />
              </SkeletonList>
            }
            empty={<p className="px-3 py-2 text-sm text-ink-faint">No categories yet.</p>}
          >
            <button
              type="button"
              aria-pressed={categoryId === ""}
              onClick={() => {
                onCategoryChange("");
              }}
              className={cx(PILL, categoryId === "" ? "bg-sunken font-medium text-ink" : PILL_IDLE)}
            >
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-ink-faint" />
              <span className="min-w-0 flex-1 truncate">All categories</span>
              <span className="shrink-0 font-mono text-[0.625rem] tracking-[0.1em] opacity-70">
                {formatCount(allCount)}
              </span>
            </button>

            {categories.map((category) => {
              const hue = hueForCategory(category.slug);
              const active = categoryId === String(category.id);
              const count = category.windows_app_count + category.linux_app_count;

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onCategoryChange(String(category.id));
                  }}
                  className={cx(PILL, active ? cx(HUE_ACTIVE[hue], "font-medium") : PILL_IDLE)}
                >
                  <span
                    aria-hidden="true"
                    className={cx("size-1.5 shrink-0 rounded-full", HUE_DOT[hue])}
                  />
                  <span className="min-w-0 flex-1 truncate">{category.name}</span>
                  <span className="shrink-0 font-mono text-[0.625rem] tracking-[0.1em] opacity-70">
                    {formatCount(count)}
                  </span>
                </button>
              );
            })}
          </QueryBoundary>
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          icon={<CloseIcon size={15} />}
          onClick={onClear}
          className="self-start"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
