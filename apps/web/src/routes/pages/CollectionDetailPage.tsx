import { useId, useState, type SyntheticEvent } from "react";
import { useParams } from "react-router";
import type { App, CollectionDetail } from "@/api/types";
import { useAuth } from "@/auth/useAuth";
import { AppCard } from "@/components/AppCard";
import { AppCardSkeleton } from "@/components/AppCardSkeleton";
import { QueryBoundary } from "@/components/QueryBoundary";
import { useApps } from "@/features/catalog/hooks";
import {
  useCollection,
  useSetCollectionApps,
  useUpdateCollection,
} from "@/features/collections/hooks";
import { messageFor } from "@/lib/errors";
import { formatCount } from "@/lib/format";
import { formString } from "@/lib/form";
import { hueForCategory, hueForKey, platformLabel, type Hue } from "@/lib/hues";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Eyebrow,
  Field,
  GlobeIcon,
  Input,
  LayersIcon,
  LinkButton,
  LockIcon,
  MinusIcon,
  PackageIcon,
  PageHeader,
  PlusIcon,
  Reveal,
  SearchInput,
  Section,
  Skeleton,
  SkeletonList,
  TerminalIcon,
  Textarea,
  cx,
} from "@/ui";

const GRID = "grid gap-5 sm:grid-cols-2 xl:grid-cols-3";

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

const REMOVE_BUTTON =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface/85 text-ink-faint shadow-soft backdrop-blur transition-all duration-200 ease-out-quint hover:border-berry hover:text-berry disabled:pointer-events-none disabled:opacity-50";

const ADD_BUTTON =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition-all duration-200 ease-out-quint hover:border-ember hover:bg-ember-soft hover:text-ember-ink disabled:pointer-events-none disabled:opacity-50";

function DetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-12 w-80 max-w-full rounded-lg" />
          <Skeleton className="h-4 w-full max-w-[46ch]" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-11 w-44 rounded-full" />
        </div>
      </div>

      <Skeleton className="mb-6 h-3 w-40 rounded-full" />

      <div className={GRID}>
        <SkeletonList count={6}>
          <AppCardSkeleton />
        </SkeletonList>
      </div>
    </div>
  );
}

function CandidateRow({
  app,
  busy,
  onAdd,
}: {
  app: App;
  busy: boolean;
  onAdd: () => void;
}) {
  const hue = hueForCategory(app.category_slug);
  const letter = app.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <li className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors duration-200 hover:border-line hover:bg-sunken/60">
      <span
        aria-hidden="true"
        className={cx(
          "grid size-9 shrink-0 place-items-center rounded-md font-display text-base leading-none",
          HUE_TILE[hue],
        )}
      >
        {letter}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-ink">{app.name}</span>
        <span className="truncate font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
          {platformLabel(app.platform)} · {app.category_name}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Add ${app.name} to this collection`}
        disabled={busy}
        onClick={onAdd}
        className={ADD_BUTTON}
      >
        <PlusIcon size={16} />
      </button>
    </li>
  );
}

function CollectionView({ collection }: { collection: CollectionDetail }) {
  const { user } = useAuth();
  const update = useUpdateCollection(collection.id);
  const setApps = useSetCollectionApps(collection.id);

  const [search, setSearch] = useState("");
  const candidates = useApps(search === "" ? { size: 10 } : { q: search, size: 10 });

  const fieldId = useId();
  const nameId = `${fieldId}-name`;
  const descriptionId = `${fieldId}-description`;
  const searchId = `${fieldId}-search`;

  const owned = user !== null && user.id === collection.user_id;
  const appIds = collection.items.map((item) => item.app.id);
  const hue = hueForKey(collection.slug);
  const description = collection.description.trim();
  const suggestions = candidates.data?.items.filter((app) => !appIds.includes(app.id)) ?? [];

  const saveDetails = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      name: formString(form, "name"),
      description: formString(form, "description"),
      is_public: form.get("is_public") !== null,
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="collection"
        hue={hue}
        title={collection.name}
        {...(description === "" ? {} : { description })}
        actions={
          <>
            {collection.is_public ? (
              <Badge hue="moss" icon={<GlobeIcon size={12} />}>
                Public
              </Badge>
            ) : (
              <Badge icon={<LockIcon size={12} />}>Private</Badge>
            )}
            <Badge icon={<LayersIcon size={12} />}>
              {formatCount(collection.items.length)}{" "}
              {collection.items.length === 1 ? "app" : "apps"}
            </Badge>
            <LinkButton
              to={`/scripts?collection=${collection.id}`}
              icon={<TerminalIcon size={16} />}
            >
              Generate script
              <span className="sr-only"> from this collection</span>
            </LinkButton>
          </>
        }
      />

      <div className="mb-6">
        <Eyebrow hue={hue}>apps in this set</Eyebrow>
      </div>

      {collection.items.length === 0 ? (
        <EmptyState
          icon={<PackageIcon size={24} />}
          title="This collection is empty"
          description={
            owned
              ? "Search the catalog below and add the apps you want this set to install."
              : "The owner has not added any apps to this collection yet."
          }
          action={
            owned ? (
              <Button
                variant="secondary"
                icon={<PlusIcon size={16} />}
                onClick={() => {
                  document.getElementById(searchId)?.focus();
                }}
              >
                Add your first app
              </Button>
            ) : (
              <LinkButton to="/apps" variant="secondary">
                Browse the catalog
              </LinkButton>
            )
          }
        />
      ) : (
        <Reveal className={GRID}>
          {collection.items.map(({ app }) => (
            <AppCard
              key={app.id}
              app={app}
              {...(owned
                ? {
                    action: (
                      <button
                        type="button"
                        aria-label={`Remove ${app.name} from this collection`}
                        disabled={setApps.isPending}
                        onClick={() => {
                          setApps.mutate(appIds.filter((value) => value !== app.id));
                        }}
                        className={REMOVE_BUTTON}
                      >
                        <MinusIcon size={16} />
                      </button>
                    ),
                  }
                : {})}
            />
          ))}
        </Reveal>
      )}

      {owned && (
        <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-8">
          <Card className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Eyebrow hue={hue}>edit</Eyebrow>
              <h2 className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">
                Collection details
              </h2>
            </div>

            <form onSubmit={saveDetails} className="flex flex-col gap-5">
              <Field label="Name" htmlFor={nameId} required>
                <Input
                  id={nameId}
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  autoComplete="off"
                  defaultValue={collection.name}
                />
              </Field>

              <Field label="Description" htmlFor={descriptionId} hint="Optional.">
                <Textarea
                  id={descriptionId}
                  name="description"
                  rows={3}
                  defaultValue={collection.description}
                />
              </Field>

              <Checkbox
                name="is_public"
                defaultChecked={collection.is_public}
                label="Public"
                description="Anyone can open a public collection and generate its script."
              />

              {update.isError && <Alert tone="danger">{messageFor(update.error)}</Alert>}
              {update.isSuccess && <Alert tone="success">Saved.</Alert>}

              <div className="pt-1">
                <Button type="submit" loading={update.isPending}>
                  Save details
                </Button>
              </div>
            </form>
          </Card>

          <Card className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Eyebrow hue={hue}>catalog</Eyebrow>
              <h2 className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">
                Add apps
              </h2>
            </div>

            <Field label="Search the catalog" htmlFor={searchId}>
              <SearchInput
                id={searchId}
                value={search}
                placeholder="firefox, vlc, docker…"
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                onClear={() => {
                  setSearch("");
                }}
              />
            </Field>

            {setApps.isError && <Alert tone="danger">{messageFor(setApps.error)}</Alert>}

            <QueryBoundary
              isPending={candidates.isPending}
              error={candidates.error}
              isEmpty={suggestions.length === 0}
              skeleton={
                <div className="flex flex-col gap-2">
                  <SkeletonList count={5}>
                    <Skeleton className="h-14 rounded-lg" />
                  </SkeletonList>
                </div>
              }
              empty={
                <p className="rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">
                  {search === ""
                    ? "These apps are already in the collection. Search to find more."
                    : "No apps match that search."}
                </p>
              }
            >
              <ul className="flex flex-col gap-1">
                {suggestions.map((app) => (
                  <CandidateRow
                    key={app.id}
                    app={app}
                    busy={setApps.isPending}
                    onAdd={() => {
                      setApps.mutate([...appIds, app.id]);
                    }}
                  />
                ))}
              </ul>
            </QueryBoundary>
          </Card>
        </div>
      )}
    </>
  );
}

export function CollectionDetailPage() {
  const { id = "" } = useParams();
  const collectionId = Number(id);
  const collection = useCollection(collectionId);
  const detail = collection.data;

  return (
    <Section>
      <QueryBoundary
        isPending={collection.isPending}
        error={collection.error}
        skeleton={<DetailSkeleton />}
      >
        {detail === undefined ? null : <CollectionView collection={detail} />}
      </QueryBoundary>
    </Section>
  );
}
