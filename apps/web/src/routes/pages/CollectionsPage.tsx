import { Link } from "react-router";
import type { Collection, Paginated } from "@/api/types";
import { useCollections, usePublicCollections } from "@/features/collections/hooks";

interface ListState {
  data: Paginated<Collection> | undefined;
  isPending: boolean;
  error: Error | null;
}

function CollectionList({ title, state }: { title: string; state: ListState }) {
  return (
    <section>
      <h1>{title}</h1>
      {state.isPending && <p aria-busy="true">Loading…</p>}
      {state.error !== null && <p role="alert">{state.error.message}</p>}
      {state.data?.items.length === 0 && <p>Nothing here yet.</p>}
      <ul>
        {state.data?.items.map((collection) => (
          <li key={collection.id}>
            <Link to={`/collections/${collection.id}`}>{collection.name}</Link>
            <span>{collection.item_count} apps</span>
            {collection.description && <p>{collection.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MyCollectionsPage() {
  const query = useCollections();
  return (
    <CollectionList
      title="My collections"
      state={{ data: query.data, isPending: query.isPending, error: query.error }}
    />
  );
}

export function PublicCollectionsPage() {
  const query = usePublicCollections();
  return (
    <CollectionList
      title="Public collections"
      state={{ data: query.data, isPending: query.isPending, error: query.error }}
    />
  );
}
