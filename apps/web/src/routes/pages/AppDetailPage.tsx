import { useParams } from "react-router";
import { isPlatform } from "@/api/types";
import { useAppBySlug } from "@/features/catalog/hooks";
import { useFavoriteIds, useToggleFavorite } from "@/features/favorites/hooks";
import { useAuth } from "@/auth/useAuth";

export function AppDetailPage() {
  const { platform = "", slug = "" } = useParams();
  const { isVerified } = useAuth();

  const app = useAppBySlug(isPlatform(platform) ? platform : "linux", slug);
  const favoriteIds = useFavoriteIds(isVerified);
  const toggleFavorite = useToggleFavorite();

  if (app.isPending) return <p aria-busy="true">Loading…</p>;
  if (app.isError) return <p role="alert">{app.error.message}</p>;

  const isFavorite = favoriteIds.data?.includes(app.data.id) ?? false;

  return (
    <article>
      <h1>{app.data.name}</h1>
      <p>{app.data.summary}</p>

      <dl>
        <dt>Platform</dt>
        <dd>{app.data.platform}</dd>
        <dt>Category</dt>
        <dd>{app.data.category_name}</dd>
        <dt>License</dt>
        <dd>{app.data.license || "Unknown"}</dd>
        <dt>Homepage</dt>
        <dd>
          {app.data.homepage_url ? (
            <a href={app.data.homepage_url} rel="noreferrer noopener" target="_blank">
              {app.data.homepage_url}
            </a>
          ) : (
            "—"
          )}
        </dd>
      </dl>

      {app.data.description && <p>{app.data.description}</p>}

      <h2>Install sources</h2>
      <ul>
        {app.data.package_refs.map((ref) => (
          <li key={`${ref.manager}-${ref.identifier}`}>
            {ref.manager}: <code>{ref.identifier}</code>
          </li>
        ))}
      </ul>

      {isVerified && (
        <button
          type="button"
          disabled={toggleFavorite.isPending}
          onClick={() => { toggleFavorite.mutate({ appId: app.data.id, isFavorite }); }}
        >
          {isFavorite ? "Remove from favorites" : "Add to favorites"}
        </button>
      )}
    </article>
  );
}
