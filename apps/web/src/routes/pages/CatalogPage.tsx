import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { isPlatform, PLATFORMS } from "@/api/types";
import { useApps, useCategories } from "@/features/catalog/hooks";
import { messageFor } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const platformParam = searchParams.get("platform") ?? "";
  const categoryParam = searchParams.get("category_id");
  const urlQuery = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [search, setSearch] = useState(urlQuery);
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

  return (
    <section>
      <h1>Catalog</h1>

      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label htmlFor="q">Search</label>
        <input
          id="q"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />

        <label htmlFor="platform">Platform</label>
        <select
          id="platform"
          value={platformParam}
          onChange={(event) => {
            update("platform", event.target.value);
          }}
        >
          <option value="">All platforms</option>
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>

        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={categoryParam ?? ""}
          onChange={(event) => {
            update("category_id", event.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.data?.items.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </form>

      {apps.isPending && <p aria-busy="true">Loading apps…</p>}
      {apps.isError && <p role="alert">{messageFor(apps.error)}</p>}
      {apps.data?.items.length === 0 && <p>No apps match those filters.</p>}

      <ul>
        {apps.data?.items.map((app) => (
          <li key={app.id}>
            <Link to={`/apps/${app.platform}/${app.slug}`}>{app.name}</Link>
            <span>{app.category_name}</span>
            <p>{app.summary}</p>
          </li>
        ))}
      </ul>

      {apps.data && apps.data.meta.pages > 1 && (
        <nav aria-label="Pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              update("page", String(page - 1));
            }}
          >
            Previous
          </button>
          <span>
            Page {apps.data.meta.page} of {apps.data.meta.pages} — {apps.data.meta.total} apps
          </span>
          <button
            type="button"
            disabled={page >= apps.data.meta.pages}
            onClick={() => {
              update("page", String(page + 1));
            }}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
