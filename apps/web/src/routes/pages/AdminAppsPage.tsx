import { useEffect, useState, type ComponentType, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router";
import { PLATFORMS, isPlatform, type App, type AppDetail, type Platform } from "@/api/types";
import { AdminShell } from "@/components/AdminNav";
import {
  DataTable,
  TableCell,
  TableRow,
  TableSkeleton,
  type DataTableColumn,
} from "@/components/DataTable";
import { PlatformFilter } from "@/components/PlatformFilter";
import { QueryBoundary } from "@/components/QueryBoundary";
import {
  useAdminApps,
  useCreateApp,
  useDeleteApp,
  useUpdateApp,
  type AppInput,
} from "@/features/admin/hooks";
import { useApp, useCategories } from "@/features/catalog/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";
import { hueForCategory, platformHue, platformLabel, type Hue } from "@/lib/hues";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  CloseIcon,
  EmptyState,
  Eyebrow,
  Field,
  Input,
  LinuxIcon,
  PackageIcon,
  PageHeader,
  Pagination,
  PencilIcon,
  PlusIcon,
  SearchInput,
  Select,
  Skeleton,
  Textarea,
  TrashIcon,
  WindowsIcon,
  cx,
  type IconProps,
} from "@/ui";

interface CategoryOption {
  id: number;
  name: string;
}

const PLATFORM_ICONS: Record<Platform, ComponentType<IconProps>> = {
  windows: WindowsIcon,
  linux: LinuxIcon,
};

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

const COLUMNS: readonly DataTableColumn[] = [
  { key: "app", label: "App" },
  { key: "platform", label: "Platform" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions", className: "text-right", hideLabel: true },
];

function readAppForm(form: FormData): AppInput {
  const platform = formString(form, "platform");
  return {
    category_id: Number(formString(form, "category_id")),
    platform: isPlatform(platform) ? platform : "linux",
    name: formString(form, "name"),
    summary: formString(form, "summary"),
    description: formString(form, "description"),
    homepage_url: formString(form, "homepage_url"),
    license: formString(form, "license"),
    is_active: form.get("is_active") !== null,
  };
}

function AppFields({
  categories,
  app,
  idPrefix,
}: {
  categories: CategoryOption[];
  app?: AppDetail;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Name" htmlFor={`${idPrefix}-name`} required>
        <Input id={`${idPrefix}-name`} name="name" required defaultValue={app?.name ?? ""} />
      </Field>

      <Field label="Category" htmlFor={`${idPrefix}-category`} required>
        <Select
          id={`${idPrefix}-category`}
          name="category_id"
          required
          defaultValue={app?.category_id ?? ""}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Platform" htmlFor={`${idPrefix}-platform`}>
        <Select id={`${idPrefix}-platform`} name="platform" defaultValue={app?.platform ?? "linux"}>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platformLabel(platform)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="License" htmlFor={`${idPrefix}-license`}>
        <Input id={`${idPrefix}-license`} name="license" defaultValue={app?.license ?? ""} />
      </Field>

      <Field label="Summary" htmlFor={`${idPrefix}-summary`} className="sm:col-span-2">
        <Input id={`${idPrefix}-summary`} name="summary" defaultValue={app?.summary ?? ""} />
      </Field>

      <Field label="Homepage" htmlFor={`${idPrefix}-homepage`} className="sm:col-span-2">
        <Input
          id={`${idPrefix}-homepage`}
          name="homepage_url"
          type="url"
          placeholder="https://example.org"
          defaultValue={app?.homepage_url ?? ""}
        />
      </Field>

      <Field label="Description" htmlFor={`${idPrefix}-description`} className="sm:col-span-2">
        <Textarea
          id={`${idPrefix}-description`}
          name="description"
          rows={3}
          defaultValue={app?.description ?? ""}
        />
      </Field>

      <Checkbox
        id={`${idPrefix}-active`}
        name="is_active"
        label="Active"
        description="Inactive apps stay in the database but disappear from the public catalog."
        defaultChecked={app?.is_active ?? true}
        containerClassName="sm:col-span-2"
      />
    </div>
  );
}

function AppRow({ app, categories }: { app: App; categories: CategoryOption[] }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const update = useUpdateApp();
  const remove = useDeleteApp();
  const detail = useApp(editing ? app.id : Number.NaN);

  const save = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate(
      { id: app.id, input: readAppForm(form) },
      {
        onSuccess: () => {
          setEditing(false);
        },
      },
    );
  };

  const hue = hueForCategory(app.category_slug);
  const PlatformIcon = PLATFORM_ICONS[app.platform];
  const editorId = `app-editor-${app.id}`;

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cx(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-md font-display text-sm",
                HUE_TILE[hue],
              )}
            >
              {app.name.slice(0, 1)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-ink">{app.name}</span>
              <span className="truncate font-mono text-[0.625rem] tracking-[0.08em] text-ink-faint">
                {app.slug}
              </span>
            </span>
          </div>
        </TableCell>

        <TableCell>
          <Badge size="sm" hue={platformHue(app.platform)} icon={<PlatformIcon size={12} />}>
            {platformLabel(app.platform)}
          </Badge>
        </TableCell>

        <TableCell>
          <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
            <span aria-hidden="true" className={cx("size-1.5 rounded-full", HUE_DOT[hue])} />
            {app.category_name}
          </span>
        </TableCell>

        <TableCell>
          {app.is_active ? (
            <Badge size="sm" hue="moss">
              active
            </Badge>
          ) : (
            <Badge size="sm">inactive</Badge>
          )}
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {confirming ? (
              <>
                <span className="mr-1 text-xs text-ink-muted">Delete this app?</span>
                <Button
                  variant="danger"
                  size="sm"
                  loading={remove.isPending}
                  onClick={() => {
                    remove.mutate(app.id);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfirming(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={editing}
                  {...(editing ? { "aria-controls": editorId } : {})}
                  icon={editing ? <CloseIcon size={15} /> : <PencilIcon size={15} />}
                  onClick={() => {
                    setEditing((current) => !current);
                  }}
                >
                  {editing ? "Close" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<TrashIcon size={15} />}
                  onClick={() => {
                    setConfirming(true);
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {remove.error === null ? null : (
        <TableRow interactive={false}>
          <TableCell colSpan={COLUMNS.length}>
            <Alert tone="danger">{messageFor(remove.error)}</Alert>
          </TableCell>
        </TableRow>
      )}

      {editing && (
        <TableRow interactive={false} className="bg-sunken/50">
          <TableCell colSpan={COLUMNS.length} id={editorId}>
            <div className="flex flex-col gap-5 py-2">
              {detail.isPending && (
                <div aria-busy="true" className="flex flex-col gap-4">
                  <span role="status" className="sr-only">
                    Loading app
                  </span>
                  <Skeleton className="h-11 w-full rounded-full" />
                  <Skeleton className="h-11 w-full rounded-full" />
                  <Skeleton className="h-28 w-full rounded-lg" />
                </div>
              )}
              {detail.error === null ? null : (
                <Alert tone="danger">{messageFor(detail.error)}</Alert>
              )}
              {detail.data === undefined ? null : (
                <form onSubmit={save} className="flex flex-col gap-5">
                  <AppFields categories={categories} app={detail.data} idPrefix={`app-${app.id}`} />
                  {update.error === null ? null : (
                    <Alert tone="danger">{messageFor(update.error)}</Alert>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" size="sm" loading={update.isPending}>
                      Save changes
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function AdminAppsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const platformParam = searchParams.get("platform") ?? "";
  const query = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(query);
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    if (debouncedSearch === query) return;
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
  }, [debouncedSearch, query, setSearchParams]);

  const apps = useAdminApps({
    ...(isPlatform(platformParam) ? { platform: platformParam } : {}),
    ...(query === "" ? {} : { q: query }),
    page,
  });
  const categories = useCategories({ size: 100 });
  const create = useCreateApp();

  const options: CategoryOption[] =
    categories.data?.items.map((category) => ({ id: category.id, name: category.name })) ?? [];

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    create.mutate(readAppForm(new FormData(element)), {
      onSuccess: () => {
        element.reset();
      },
    });
  };

  const total = apps.data?.meta.total;

  return (
    <AdminShell>
      <PageHeader
        eyebrow="admin · catalog"
        title="Apps"
        description="Every entry in the catalog, across both platforms."
        actions={
          <Button
            icon={creating ? <CloseIcon size={16} /> : <PlusIcon size={16} />}
            aria-expanded={creating}
            {...(creating ? { "aria-controls": "new-app-panel" } : {})}
            onClick={() => {
              setCreating((current) => !current);
            }}
          >
            {creating ? "Close" : "New app"}
          </Button>
        }
      />

      {creating && (
        <Card id="new-app-panel" className="mb-8 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow hue="moss">new app</Eyebrow>
            <h2 className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">
              Add an app to the catalog
            </h2>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            <AppFields categories={options} idPrefix="new-app" />
            {create.error === null ? null : <Alert tone="danger">{messageFor(create.error)}</Alert>}
            {create.isSuccess && <Alert tone="success">App created.</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={create.isPending}>
                Create app
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-5">
        <form
          role="search"
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Field label="Search" htmlFor="admin-q" className="lg:max-w-md lg:flex-1">
            <SearchInput
              id="admin-q"
              placeholder="Search apps by name"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              onClear={() => {
                setSearch("");
              }}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">Platform</span>
            <PlatformFilter
              value={platformParam}
              includeAll
              onChange={(value) => {
                update("platform", value);
              }}
            />
          </div>
        </form>
      </Card>

      <p
        aria-live="polite"
        className="mb-4 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted"
      >
        {total === undefined ? "—" : `${total} apps`}
      </p>

      <QueryBoundary
        isPending={apps.isPending}
        error={apps.error}
        isEmpty={apps.data?.items.length === 0}
        skeleton={<TableSkeleton columns={COLUMNS} rows={8} />}
        empty={
          <EmptyState
            icon={<PackageIcon size={24} />}
            title="No apps match"
            description="Try a different search term or switch platforms."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch("");
                  update("platform", "");
                }}
              >
                Clear filters
              </Button>
            }
          />
        }
      >
        <DataTable columns={COLUMNS}>
          {apps.data?.items.map((app) => (
            <AppRow key={app.id} app={app} categories={options} />
          ))}
        </DataTable>
      </QueryBoundary>

      {apps.data === undefined ? null : (
        <Pagination
          className="mt-8"
          page={apps.data.meta.page}
          pages={apps.data.meta.pages}
          total={apps.data.meta.total}
          unit="apps"
          onChange={(next) => {
            update("page", String(next));
          }}
        />
      )}
    </AdminShell>
  );
}
