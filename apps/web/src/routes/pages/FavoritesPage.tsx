import { Link } from "react-router";
import { useFavorites } from "@/features/favorites/hooks";

export function FavoritesPage() {
  const favorites = useFavorites();

  return (
    <section>
      <h1>Favorites</h1>
      {favorites.isPending && <p aria-busy="true">Loading…</p>}
      {favorites.isError && <p role="alert">{favorites.error.message}</p>}
      {favorites.data?.items.length === 0 && <p>You have not favorited any apps yet.</p>}
      <ul>
        {favorites.data?.items.map((app) => (
          <li key={app.id}>
            <Link to={`/apps/${app.platform}/${app.slug}`}>{app.name}</Link>
            <p>{app.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
