import { useEffect, useRef, useState, type ComponentType } from "react";
import { useSearchParams } from "react-router";
import { isPlatform, type App, type Platform } from "@/api/types";
import { useAuth } from "@/auth/useAuth";
import { PlatformFilter } from "@/components/PlatformFilter";
import { QueryBoundary } from "@/components/QueryBoundary";
import { useApp, useApps, useCategories } from "@/features/catalog/hooks";
import { useCollection } from "@/features/collections/hooks";
import type { BagItem } from "@/scriptbag/context";
import { useScriptBag } from "@/scriptbag/useScriptBag";
import { downloadScript, useGenerateScript, type GeneratedScript } from "@/features/scripts/hooks";
import { messageFor } from "@/lib/errors";
import { formatCount } from "@/lib/format";
import { hueForCategory, platformHue, platformLabel, type Hue } from "@/lib/hues";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import {
  Alert,
  Badge,
  Button,
  Card,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  CopyButton,
  DownloadIcon,
  EmptyState,
  Eyebrow,
  Field,
  LinkButton,
  LinuxIcon,
  PageHeader,
  SearchIcon,
  SearchInput,
  Section,
  Select,
  Skeleton,
  SkeletonList,
  Terminal,
  TerminalIcon,
  TrashIcon,
  WindowsIcon,
  cx,
  type IconProps,
} from "@/ui";

const CATALOG_PAGE_SIZE = 100;
const PREVIEW_LINE_COUNT = 24;

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

function parseId(value: string | null): number {
  if (value === null) return Number.NaN;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function AppTile({
  app,
  selected,
  onToggle,
}: {
  app: App;
  selected: boolean;
  onToggle: (app: App) => void;
}) {
  const hue = hueForCategory(app.category_slug);
  const letter = app.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        onToggle(app);
      }}
      className={cx(
        "group flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all duration-200 ease-out-quint",
        selected
          ? "border-ember bg-ember-soft/45 shadow-soft"
          : "border-line bg-surface hover:-translate-y-0.5 hover:border-line-strong hover:shadow-soft",
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "grid size-10 shrink-0 place-items-center rounded-md font-display text-lg leading-none",
          HUE_TILE[hue],
        )}
      >
        {letter}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-display text-[0.9375rem] leading-snug tracking-[-0.01em] text-ink">
          {app.name}
        </span>
        <span className="truncate font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
          {app.category_name}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={cx(
          "grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-200 ease-out-quint",
          selected
            ? "border-ember bg-ember text-white"
            : "border-line-strong text-transparent group-hover:border-ember",
        )}
      >
        <CheckIcon size={14} strokeWidth={2.8} />
      </span>
    </button>
  );
}

function TileSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4"
    >
      <Skeleton className="size-10 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-2.5 w-1/3 rounded-full" />
      </div>
      <Skeleton className="size-6 shrink-0 rounded-full" />
    </div>
  );
}

function SelectionChip({
  id,
  name,
  onRemove,
}: {
  id: number;
  name: string;
  onRemove: (id: number) => void;
}) {
  return (
    <button
      type="button"
      title={`Remove ${name}`}
      onClick={() => {
        onRemove(id);
      }}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-sunken py-1.5 pl-3.5 pr-2 text-sm text-ink transition-colors duration-200 ease-out-quint hover:border-ember hover:bg-ember-soft hover:text-ember-ink"
    >
      <span className="truncate">{name}</span>
      <span className="sr-only">Remove from selection</span>
      <CloseIcon
        size={13}
        className="shrink-0 text-ink-faint transition-colors duration-200 group-hover:text-ember"
      />
    </button>
  );
}

function ScriptResult({ script }: { script: GeneratedScript }) {
  const lines = script.content.split("\n");
  const preview = lines.slice(0, PREVIEW_LINE_COUNT);
  const remaining = lines.length - preview.length;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="builder-result-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Eyebrow hue="moss">script ready</Eyebrow>
          <h2
            id="builder-result-heading"
            className="font-display text-2xl leading-tight tracking-[-0.02em] text-ink"
          >
            Your download has started.
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<DownloadIcon size={16} />}
          onClick={() => {
            downloadScript(script);
          }}
        >
          Download again
        </Button>
      </div>

      <Terminal
        title={script.filename}
        actions={<CopyButton value={script.content} variant="terminal" size="sm" />}
      >
        <ol className="flex flex-col">
          {preview.map((line, index) => (
            <li key={index} className="flex gap-4">
              <span
                aria-hidden="true"
                className="w-6 shrink-0 select-none text-right text-terminal-ink/25"
              >
                {index + 1}
              </span>
              <span className="whitespace-pre">{line}</span>
            </li>
          ))}
        </ol>
        {remaining > 0 && (
          <p className="mt-4 pl-10 text-terminal-ink/45">… {remaining} more lines in the file</p>
        )}
      </Terminal>

      {script.skipped.length > 0 && (
        <Alert tone="warning" title="Left out of the script">
          No installer is available for {script.skipped.join(", ")} on this platform.
        </Alert>
      )}
    </section>
  );
}

export function ScriptBuilderPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const bag = useScriptBag();
  const { add: addToBag } = bag;
  const seeded = useRef(new Set<number>());

  const [platformOverride, setPlatformOverride] = useState<Platform | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const debouncedSearch = useDebouncedValue(search);
  const query = debouncedSearch.trim();

  const platformParam = searchParams.get("platform");
  const urlPlatform = platformParam !== null && isPlatform(platformParam) ? platformParam : null;

  const seedAppId = parseId(searchParams.get("app"));
  const seedCollectionId = Number.isNaN(seedAppId)
    ? parseId(searchParams.get("collection"))
    : Number.NaN;

  const seedApp = useApp(seedAppId);
  const seedCollection = useCollection(seedCollectionId);
  const seedCollectionApps = seedCollection.data?.items.map((item) => item.app) ?? [];

  const platform: Platform =
    platformOverride ??
    urlPlatform ??
    seedApp.data?.platform ??
    seedCollectionApps[0]?.platform ??
    (bag.items.linux.length === 0 && bag.items.windows.length > 0 ? "windows" : "linux");

  const selected = bag.items[platform].map((item) => item.id);

  useEffect(() => {
    const incoming: BagItem[] = [];
    const app = seedApp.data;
    if (app !== undefined) {
      incoming.push({ id: app.id, name: app.name, slug: app.slug, platform: app.platform });
    }
    for (const entry of seedCollection.data?.items ?? []) {
      const member = entry.app;
      incoming.push({
        id: member.id,
        name: member.name,
        slug: member.slug,
        platform: member.platform,
      });
    }
    for (const item of incoming) {
      if (seeded.current.has(item.id)) continue;
      seeded.current.add(item.id);
      addToBag(item);
    }
  }, [seedApp.data, seedCollection.data, addToBag]);

  const categories = useCategories({ size: CATALOG_PAGE_SIZE });
  const catalog = useApps({
    platform,
    size: CATALOG_PAGE_SIZE,
    ...(query === "" ? {} : { q: query }),
    ...(categoryId === "" ? {} : { category_id: Number(categoryId) }),
  });
  const generate = useGenerateScript();

  const items = catalog.data?.items ?? [];

  const knownNames = new Map<number, string>();
  for (const app of seedCollectionApps) knownNames.set(app.id, app.name);
  if (seedApp.data !== undefined) knownNames.set(seedApp.data.id, seedApp.data.name);
  for (const app of items) knownNames.set(app.id, app.name);

  for (const item of bag.items[platform]) knownNames.set(item.id, item.name);

  const nameFor = (id: number): string => knownNames.get(id) ?? `App #${id}`;

  const changePlatform = (value: string) => {
    if (!isPlatform(value)) return;
    setPlatformOverride(value);
  };

  const toggle = (app: App) => {
    setPlatformOverride(platform);
    bag.toggle({ id: app.id, name: app.name, slug: app.slug, platform: app.platform });
  };

  const remove = (id: number) => {
    setPlatformOverride(platform);
    bag.remove(id);
  };

  const clearAll = () => {
    setPlatformOverride(platform);
    bag.clear(platform);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
  };

  const build = () => {
    generate.mutate(
      { platform, app_ids: selected },
      {
        onSuccess: (script) => {
          downloadScript(script);
        },
      },
    );
  };

  const script = generate.data;
  const PlatformIcon = PLATFORM_ICONS[platform];
  const total = catalog.data?.meta.total ?? 0;

  return (
    <Section>
      <PageHeader
        eyebrow="script builder"
        title="Your whole setup, one script."
        description="Choose a platform, pick your apps, and walk away with a single file that installs every one of them."
        actions={
          isAuthenticated ? (
            <LinkButton to="/scripts/history" variant="secondary" icon={<ClockIcon size={16} />}>
              Script history
            </LinkButton>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-10">
          {script === undefined ? null : <ScriptResult script={script} />}

          <section className="flex flex-col gap-5" aria-labelledby="builder-platform-heading">
            <div className="flex flex-col gap-2.5">
              <Eyebrow hue="sky">01 · target platform</Eyebrow>
              <h2
                id="builder-platform-heading"
                className="font-display text-xl leading-tight tracking-[-0.02em] text-ink"
              >
                Where are you installing?
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <PlatformFilter value={platform} onChange={changePlatform} />
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                Each platform keeps its own list
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-5" aria-labelledby="builder-apps-heading">
            <div className="flex flex-col gap-2.5">
              <Eyebrow hue="honey">02 · choose your apps</Eyebrow>
              <h2
                id="builder-apps-heading"
                className="font-display text-xl leading-tight tracking-[-0.02em] text-ink"
              >
                What should it install?
              </h2>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Field
                label="Search the catalog"
                htmlFor="builder-search"
                className="min-w-0 flex-1"
              >
                <SearchInput
                  id="builder-search"
                  name="q"
                  placeholder="firefox, vlc, docker…"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  onClear={() => {
                    setSearch("");
                  }}
                />
              </Field>

              <Field label="Category" htmlFor="builder-category" className="sm:w-56">
                <Select
                  id="builder-category"
                  name="category_id"
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                  }}
                >
                  <option value="">All categories</option>
                  {categories.data?.items.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
              {catalog.data === undefined ? (
                <Skeleton className="h-3 w-28 rounded-full" />
              ) : (
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
                  {formatCount(total)} {total === 1 ? "app" : "apps"}
                </p>
              )}
              {total > items.length && (
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-faint">
                  showing the first {items.length} · refine with search
                </p>
              )}
            </div>

            <QueryBoundary
              isPending={catalog.isPending}
              error={catalog.error}
              isEmpty={items.length === 0}
              skeleton={
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  <SkeletonList count={9}>
                    <TileSkeleton />
                  </SkeletonList>
                </div>
              }
              empty={
                <EmptyState
                  icon={<SearchIcon size={24} />}
                  title="Nothing matches those filters"
                  description="Try a looser search term, or bring back every category."
                  action={
                    <Button variant="secondary" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  }
                />
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {items.map((app) => (
                  <AppTile
                    key={app.id}
                    app={app}
                    selected={selected.includes(app.id)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </QueryBoundary>
          </section>
        </div>

        <aside className="w-full lg:sticky lg:top-24 lg:w-96 lg:shrink-0">
          <Card className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-3">
                <Eyebrow>your script</Eyebrow>
                <span
                  aria-hidden="true"
                  className="font-display text-[3.25rem] leading-none tracking-[-0.04em] text-ink"
                >
                  {selected.length}
                </span>
                <span
                  aria-hidden="true"
                  className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-muted"
                >
                  {selected.length === 1 ? "app selected" : "apps selected"}
                </span>
                <p aria-live="polite" className="sr-only">
                  {selected.length} apps selected
                </p>
              </div>
              <Badge hue={platformHue(platform)} icon={<PlatformIcon size={12} />}>
                {platformLabel(platform)}
              </Badge>
            </div>

            {selected.length === 0 ? (
              <EmptyState
                icon={<TerminalIcon size={22} />}
                title="Nothing queued yet"
                description="Pick apps from the list and they line up here."
              />
            ) : (
              <div className="flex flex-col gap-4">
                <ul className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
                  {selected.map((id) => (
                    <li key={id} className="min-w-0">
                      <SelectionChip id={id} name={nameFor(id)} onRemove={remove} />
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<TrashIcon size={15} />}
                  onClick={clearAll}
                  className="self-start"
                >
                  Clear all
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                block
                icon={<DownloadIcon size={18} />}
                loading={generate.isPending}
                disabled={selected.length === 0}
                onClick={build}
              >
                Generate &amp; download
              </Button>
              <p className="text-center text-xs leading-relaxed text-ink-faint">
                Built on the server, downloaded straight to your machine.
              </p>
            </div>

            {generate.isError && <Alert tone="danger">{messageFor(generate.error)}</Alert>}
          </Card>
        </aside>
      </div>
    </Section>
  );
}
