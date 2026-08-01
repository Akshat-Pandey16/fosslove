import { useParams } from "react-router";
import type { Category } from "@/api/types";
import { AppCard } from "@/components/AppCard";
import { AppCardSkeleton } from "@/components/AppCardSkeleton";
import { QueryBoundary } from "@/components/QueryBoundary";
import { useApps, useCategoryBySlug } from "@/features/catalog/hooks";
import { formatCount } from "@/lib/format";
import { hueForCategory, type Hue } from "@/lib/hues";
import {
  EmptyState,
  Eyebrow,
  LinkButton,
  LinuxIcon,
  PackageIcon,
  Section,
  Skeleton,
  SkeletonList,
  SkeletonText,
  WindowsIcon,
  cx,
} from "@/ui";

const GRID = "grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

const HUE_BAND: Record<Hue, string> = {
  ember: "bg-ember-soft text-ember-ink",
  honey: "bg-honey-soft text-honey-ink",
  moss: "bg-moss-soft text-moss-ink",
  pine: "bg-pine-soft text-pine-ink",
  sky: "bg-sky-soft text-sky-ink",
  cobalt: "bg-cobalt-soft text-cobalt-ink",
  plum: "bg-plum-soft text-plum-ink",
  berry: "bg-berry-soft text-berry-ink",
};

const FIGURE = "font-mono text-[clamp(1.75rem,4vw,2.5rem)] leading-none tracking-[-0.04em]";

const FIGURE_LABEL =
  "inline-flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.18em] opacity-70";

function CategoryHeroSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-6 rounded-2xl border border-line bg-sunken p-8 sm:p-12"
    >
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-12 w-80 max-w-full" />
      <SkeletonText lines={2} className="max-w-[58ch]" />
      <div className="flex gap-12 pt-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

function CategoryHero({ category }: { category: Category }) {
  const hue = hueForCategory(category.slug);
  const description = category.description.trim();

  return (
    <div className={cx("grain overflow-hidden rounded-2xl p-8 sm:p-12", HUE_BAND[hue])}>
      <div className="flex flex-col gap-6">
        <Eyebrow hue={hue}>category</Eyebrow>

        <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1] tracking-[-0.03em]">
          {category.name}
        </h1>

        {description === "" ? null : (
          <p className="max-w-[58ch] text-base leading-relaxed opacity-80">{description}</p>
        )}

        <div className="flex flex-wrap items-end gap-x-12 gap-y-6 pt-2">
          <dl className="flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-2.5">
              <dt className={FIGURE_LABEL}>
                <WindowsIcon size={13} />
                Windows
              </dt>
              <dd className={FIGURE}>{formatCount(category.windows_app_count)}</dd>
            </div>
            <div className="flex flex-col gap-2.5">
              <dt className={FIGURE_LABEL}>
                <LinuxIcon size={13} />
                Linux
              </dt>
              <dd className={FIGURE}>{formatCount(category.linux_app_count)}</dd>
            </div>
          </dl>

          <LinkButton
            to={`/apps?category_id=${category.id}`}
            variant="secondary"
            size="sm"
            className="mb-1"
          >
            Filter in the catalog
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

export function CategoryPage() {
  const { slug = "" } = useParams();
  const category = useCategoryBySlug(slug);
  const apps = useApps(category.data ? { category_id: category.data.id, size: 50 } : {});

  return (
    <>
      <div className="shell pt-8 pb-6 sm:pt-12">
        <QueryBoundary
          isPending={category.isPending}
          error={category.error}
          skeleton={<CategoryHeroSkeleton />}
        >
          {category.data === undefined ? null : <CategoryHero category={category.data} />}
        </QueryBoundary>
      </div>

      {category.data === undefined ? null : (
        <Section>
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
            <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight tracking-[-0.02em] text-ink">
              Apps in {category.data.name}
            </h2>
            {apps.data === undefined ? null : (
              <span
                role="status"
                className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted"
              >
                {formatCount(apps.data.meta.total)} total
              </span>
            )}
          </div>

          <QueryBoundary
            isPending={apps.isPending}
            error={apps.error}
            isEmpty={apps.data?.items.length === 0}
            skeleton={
              <div className={GRID}>
                <SkeletonList count={8}>
                  <AppCardSkeleton />
                </SkeletonList>
              </div>
            }
            empty={
              <EmptyState
                icon={<PackageIcon size={24} />}
                title="No apps in this category yet"
                description="Nothing has been catalogued here so far. The rest of the catalog is still worth a look."
                action={
                  <LinkButton to="/apps" variant="secondary">
                    Browse the catalog
                  </LinkButton>
                }
              />
            }
          >
            <div className={GRID}>
              {apps.data?.items.map((app) => <AppCard key={app.id} app={app} />)}
            </div>
          </QueryBoundary>
        </Section>
      )}
    </>
  );
}
