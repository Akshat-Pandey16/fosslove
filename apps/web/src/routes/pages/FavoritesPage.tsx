import { AppCard } from "@/components/AppCard";
import { AppCardSkeleton } from "@/components/AppCardSkeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { QueryBoundary } from "@/components/QueryBoundary";
import { useFavoriteIds, useFavorites } from "@/features/favorites/hooks";
import { formatCount } from "@/lib/format";
import {
  EmptyState,
  HeartIcon,
  LinkButton,
  PageHeader,
  Reveal,
  SearchIcon,
  Section,
  SkeletonList,
  TerminalIcon,
} from "@/ui";

const GRID = "grid gap-5 sm:grid-cols-2 xl:grid-cols-3";

export function FavoritesPage() {
  const favorites = useFavorites();
  const favoriteIds = useFavoriteIds(true);

  const items = favorites.data?.items ?? [];

  return (
    <Section>
      <PageHeader
        eyebrow="your library"
        title="Favorites"
        description="The apps you have kept, ready to drop straight into your next install script."
        hue="berry"
        actions={
          <>
            <LinkButton to="/apps" variant="secondary" icon={<SearchIcon size={16} />}>
              Browse the catalog
            </LinkButton>
            <LinkButton to="/scripts" icon={<TerminalIcon size={16} />}>
              Build a script
            </LinkButton>
          </>
        }
      />

      {favorites.data === undefined ? null : (
        <p className="mb-8 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
          {formatCount(favorites.data.meta.total)} saved
        </p>
      )}

      <QueryBoundary
        isPending={favorites.isPending}
        error={favorites.error}
        isEmpty={items.length === 0}
        skeleton={
          <div className={GRID}>
            <SkeletonList count={6}>
              <AppCardSkeleton />
            </SkeletonList>
          </div>
        }
        empty={
          <EmptyState
            icon={<HeartIcon size={24} />}
            title="No favorites yet"
            description="Tap the heart on any app in the catalog and it will wait for you here."
            action={
              <LinkButton to="/apps" icon={<SearchIcon size={16} />}>
                Browse the catalog
              </LinkButton>
            }
          />
        }
      >
        <Reveal className={GRID}>
          {items.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              action={
                <FavoriteButton
                  appId={app.id}
                  isFavorite={favoriteIds.data?.includes(app.id) ?? true}
                  size="sm"
                />
              }
            />
          ))}
        </Reveal>
      </QueryBoundary>
    </Section>
  );
}
