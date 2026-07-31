import { Link, useParams } from "react-router";
import { useCollection } from "@/features/collections/hooks";

export function CollectionDetailPage() {
  const { id = "" } = useParams();
  const collection = useCollection(Number(id));

  if (collection.isPending) return <p aria-busy="true">Loading…</p>;
  if (collection.isError) return <p role="alert">{collection.error.message}</p>;

  return (
    <article>
      <h1>{collection.data.name}</h1>
      {collection.data.description && <p>{collection.data.description}</p>}
      <p>{collection.data.is_public ? "Public" : "Private"}</p>

      <ul>
        {collection.data.items.map(({ app }) => (
          <li key={app.id}>
            <Link to={`/apps/${app.platform}/${app.slug}`}>{app.name}</Link>
            <p>{app.summary}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
