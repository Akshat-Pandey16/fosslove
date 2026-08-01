import { type SyntheticEvent } from "react";
import { Link } from "react-router";
import type { Collection, Paginated } from "@/api/types";
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  usePublicCollections,
} from "@/features/collections/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";

interface ListState {
  data: Paginated<Collection> | undefined;
  isPending: boolean;
  error: Error | null;
}

function CollectionList({
  title,
  state,
  onDelete,
}: {
  title: string;
  state: ListState;
  onDelete?: (id: number) => void;
}) {
  return (
    <section>
      <h1>{title}</h1>
      {state.isPending && <p aria-busy="true">Loading…</p>}
      {state.error !== null && <p role="alert">{messageFor(state.error)}</p>}
      {state.data?.items.length === 0 && <p>Nothing here yet.</p>}
      <ul>
        {state.data?.items.map((collection) => (
          <li key={collection.id}>
            <Link to={`/collections/${collection.id}`}>{collection.name}</Link>
            <span>{collection.item_count} apps</span>
            <span>{collection.is_public ? "Public" : "Private"}</span>
            {collection.description && <p>{collection.description}</p>}
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(collection.id);
                }}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MyCollectionsPage() {
  const query = useCollections();
  const create = useCreateCollection();
  const remove = useDeleteCollection();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    create.mutate(
      {
        name: formString(form, "name"),
        description: formString(form, "description"),
        is_public: form.get("is_public") !== null,
      },
      { onSuccess: () => { element.reset(); } },
    );
  };

  return (
    <>
      <CollectionList
        title="My collections"
        state={{ data: query.data, isPending: query.isPending, error: query.error }}
        onDelete={(id) => { remove.mutate(id); }}
      />

      <section>
        <h2>New collection</h2>
        <form onSubmit={submit}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" required maxLength={120} />

          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={2} />

          <label htmlFor="is_public">
            <input id="is_public" name="is_public" type="checkbox" />
            Make this collection public
          </label>

          {create.isError && <p role="alert">{messageFor(create.error)}</p>}
          {remove.isError && <p role="alert">{messageFor(remove.error)}</p>}

          <button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create collection"}
          </button>
        </form>
      </section>
    </>
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
