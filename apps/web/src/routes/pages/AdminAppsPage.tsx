import { useEffect, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router";
import { PLATFORMS, isPlatform, type App, type AppDetail } from "@/api/types";
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
import { useDebouncedValue } from "@/lib/useDebouncedValue";

interface CategoryOption {
  id: number;
  name: string;
}

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
    <>
      <label htmlFor={`${idPrefix}-name`}>Name</label>
      <input id={`${idPrefix}-name`} name="name" required defaultValue={app?.name ?? ""} />

      <label htmlFor={`${idPrefix}-category`}>Category</label>
      <select
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
      </select>

      <label htmlFor={`${idPrefix}-platform`}>Platform</label>
      <select id={`${idPrefix}-platform`} name="platform" defaultValue={app?.platform ?? "linux"}>
        {PLATFORMS.map((platform) => (
          <option key={platform} value={platform}>
            {platform}
          </option>
        ))}
      </select>

      <label htmlFor={`${idPrefix}-summary`}>Summary</label>
      <input id={`${idPrefix}-summary`} name="summary" defaultValue={app?.summary ?? ""} />

      <label htmlFor={`${idPrefix}-description`}>Description</label>
      <textarea
        id={`${idPrefix}-description`}
        name="description"
        rows={3}
        defaultValue={app?.description ?? ""}
      />

      <label htmlFor={`${idPrefix}-homepage`}>Homepage</label>
      <input
        id={`${idPrefix}-homepage`}
        name="homepage_url"
        type="url"
        defaultValue={app?.homepage_url ?? ""}
      />

      <label htmlFor={`${idPrefix}-license`}>License</label>
      <input id={`${idPrefix}-license`} name="license" defaultValue={app?.license ?? ""} />

      <label htmlFor={`${idPrefix}-active`}>
        <input
          id={`${idPrefix}-active`}
          name="is_active"
          type="checkbox"
          defaultChecked={app?.is_active ?? true}
        />
        Active
      </label>
    </>
  );
}

function AppRow({ app, categories }: { app: App; categories: CategoryOption[] }) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateApp();
  const remove = useDeleteApp();
  const detail = useApp(editing ? app.id : Number.NaN);

  const save = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate(
      { id: app.id, input: readAppForm(form) },
      { onSuccess: () => { setEditing(false); } },
    );
  };

  if (editing) {
    return (
      <li>
        {detail.isPending && <p aria-busy="true">Loading app…</p>}
        {detail.isError && <p role="alert">{messageFor(detail.error)}</p>}
        {detail.data && (
          <form onSubmit={save}>
            <AppFields categories={categories} app={detail.data} idPrefix={`app-${app.id}`} />
            {update.isError && <p role="alert">{messageFor(update.error)}</p>}
            <button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => { setEditing(false); }}>
              Cancel
            </button>
          </form>
        )}
      </li>
    );
  }

  return (
    <li>
      <strong>{app.name}</strong>
      <span>{app.platform}</span>
      <span>{app.category_name}</span>
      {!app.is_active && <span>inactive</span>}
      <p>{app.summary}</p>
      <button type="button" onClick={() => { setEditing(true); }}>
        Edit
      </button>
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => { remove.mutate(app.id); }}
      >
        Delete
      </button>
      {remove.isError && <p role="alert">{messageFor(remove.error)}</p>}
    </li>
  );
}

export function AdminAppsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const platformParam = searchParams.get("platform") ?? "";
  const query = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(query);
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
      onSuccess: () => { element.reset(); },
    });
  };

  return (
    <>
      <h1>Apps</h1>

      <form role="search" onSubmit={(event) => { event.preventDefault(); }}>
        <label htmlFor="admin-q">Search</label>
        <input
          id="admin-q"
          type="search"
          value={search}
          onChange={(event) => { setSearch(event.target.value); }}
        />

        <label htmlFor="admin-platform">Platform</label>
        <select
          id="admin-platform"
          value={platformParam}
          onChange={(event) => { update("platform", event.target.value); }}
        >
          <option value="">All platforms</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>
      </form>

      {apps.isPending && <p aria-busy="true">Loading…</p>}
      {apps.isError && <p role="alert">{messageFor(apps.error)}</p>}

      <ul>
        {apps.data?.items.map((app) => (
          <AppRow key={app.id} app={app} categories={options} />
        ))}
      </ul>

      {apps.data && apps.data.meta.pages > 1 && (
        <nav aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => { update("page", String(page - 1)); }}
          >
            Previous
          </button>
          <span>
            Page {apps.data.meta.page} of {apps.data.meta.pages} — {apps.data.meta.total} apps
          </span>
          <button
            type="button"
            disabled={page >= apps.data.meta.pages}
            onClick={() => { update("page", String(page + 1)); }}
          >
            Next
          </button>
        </nav>
      )}

      <section>
        <h2>New app</h2>
        <form onSubmit={submit}>
          <AppFields categories={options} idPrefix="new-app" />
          {create.isError && <p role="alert">{messageFor(create.error)}</p>}
          <button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create app"}
          </button>
        </form>
      </section>
    </>
  );
}
