import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { isPlatform } from "@/api/types";
import { useAuth } from "@/auth/useAuth";
import { AppCard } from "@/components/AppCard";
import { AppCardSkeleton } from "@/components/AppCardSkeleton";
import { CatalogFilters } from "@/components/CatalogFilters";
import { FavoriteButton } from "@/components/FavoriteButton";
import { QueryBoundary } from "@/components/QueryBoundary";
import { useApps, useCategories } from "@/features/catalog/hooks";
import { useFavoriteIds } from "@/features/favorites/hooks";
import { formatCount } from "@/lib/format";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import {
  Button,
  EmptyState,
  PageHeader,
  Pagination,
  SearchIcon,
  Section,
  Skeleton,
  SkeletonList,
  SlidersIcon,
  cx,
} from "@/ui";

const GRID = "grid gap-5 sm:grid-cols-2 xl:grid-cols-3";

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isVerified } = useAuth();

  const platformParam = searchParams.get("platform") ?? "";
  const categoryParam = searchParams.get("category_id");
  const urlQuery = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [search, setSearch] = useState(urlQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const update = (key: string, value: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === "") next.delete(key);
        else next.set(key, value);
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: key === "q" },
    );
  };

  useEffect(() => {
    if (debouncedSearch === urlQuery) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (debouncedSearch === "") next.delete("q");
        else next.set("q", debouncedSearch);
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }, [debouncedSearch, urlQuery, setSearchParams]);

  const apps = useApps({
    ...(isPlatform(platformParam) ? { platform: platformParam } : {}),
    ...(categoryParam === null ? {} : { category_id: Number(categoryParam) }),
    ...(urlQuery === "" ? {} : { q: urlQuery }),
    page,
  });
  const categories = useCategories({ size: 100 });
  const favoriteIds = useFavoriteIds(isVerified);

  const favorites = new Set(favoriteIds.data ?? []);
  const hasFilters = platformParam !== "" || categoryParam !== null || urlQuery !== "";
  const total = apps.data?.meta.total;

  const clearFilters = () => {
    setSearch("");
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("platform");
        next.delete("category_id");
        next.delete("q");
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  };

  return (
    <Section>
      <PageHeader
        eyebrow="catalog"
        title="Catalog"
        description="Free and open-source apps for Windows and Linux. Pick what you need and FOSSLove writes the install script."
        actions={
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            icon={<SlidersIcon size={16} />}
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
            onClick={() => {
              setFiltersOpen((open) => !open);
            }}
          >
            Filters
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <aside
          id="catalog-filters"
          className={cx(
            "rounded-xl border border-line bg-surface p-5 shadow-soft lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
            filtersOpen ? "block" : "hidden lg:block",
          )}
        >
          <CatalogFilters
            search={search}
            onSearchChange={setSearch}
            platform={platformParam}
            onPlatformChange={(value) => {
              update("platform", value);
            }}
            categoryId={categoryParam ?? ""}
            onCategoryChange={(value) => {
              update("category_id", value);
            }}
            categories={categories.data?.items ?? []}
            categoriesPending={categories.isPending}
            categoriesError={categories.error}
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-4">
            {total === undefined ? (
              <Skeleton className="h-3 w-28 rounded-full" />
            ) : (
              <p
                role="status"
                className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted"
              >
                {formatCount(total)} {total === 1 ? "app" : "apps"}
                {urlQuery === "" ? "" : ` · “${urlQuery}”`}
              </p>
            )}
          </div>

          <QueryBoundary
            isPending={apps.isPending}
            error={apps.error}
            isEmpty={apps.data?.items.length === 0}
            skeleton={
              <div className={GRID}>
                <SkeletonList count={9}>
                  <AppCardSkeleton />
                </SkeletonList>
              </div>
            }
            empty={
              <EmptyState
                icon={<SearchIcon size={24} />}
                title="No apps match those filters"
                description="Try another platform, a different category, or a shorter search term."
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            }
          >
            <div className={GRID}>
              {apps.data?.items.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  {...(isVerified
                    ? {
                        action: (
                          <FavoriteButton
                            appId={app.id}
                            isFavorite={favorites.has(app.id)}
                            size="sm"
                          />
                        ),
                      }
                    : {})}
                />
              ))}
            </div>
          </QueryBoundary>

          {apps.data === undefined ? null : (
            <Pagination
              className="mt-12"
              page={page}
              pages={apps.data.meta.pages}
              total={apps.data.meta.total}
              unit="apps"
              onChange={(next) => {
                update("page", String(next));
              }}
            />
          )}
        </div>
      </div>
    </Section>
  );
}
