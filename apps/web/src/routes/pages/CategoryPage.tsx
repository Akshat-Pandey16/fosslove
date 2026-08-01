import { Link, useParams } from "react-router";
import { useApps, useCategoryBySlug } from "@/features/catalog/hooks";
import { messageFor } from "@/lib/errors";

export function CategoryPage() {
  const { slug = "" } = useParams();
  const category = useCategoryBySlug(slug);
  const apps = useApps(category.data ? { category_id: category.data.id, size: 50 } : {});

  if (category.isPending) return <p aria-busy="true">Loading…</p>;
  if (category.isError) return <p role="alert">{messageFor(category.error)}</p>;

  return (
    <section>
      <h1>{category.data.name}</h1>
      {category.data.description && <p>{category.data.description}</p>}
      <p>
        {category.data.windows_app_count} Windows · {category.data.linux_app_count} Linux
      </p>

      {apps.isPending && <p aria-busy="true">Loading apps…</p>}
      <ul>
        {apps.data?.items.map((app) => (
          <li key={app.id}>
            <Link to={`/apps/${app.platform}/${app.slug}`}>{app.name}</Link>
            <span>{app.platform}</span>
            <p>{app.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
