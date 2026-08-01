import { useState, type SyntheticEvent } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "@/auth/useAuth";
import { useApps } from "@/features/catalog/hooks";
import {
  useCollection,
  useSetCollectionApps,
  useUpdateCollection,
} from "@/features/collections/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";

export function CollectionDetailPage() {
  const { id = "" } = useParams();
  const collectionId = Number(id);
  const { user } = useAuth();

  const collection = useCollection(collectionId);
  const update = useUpdateCollection(collectionId);
  const setApps = useSetCollectionApps(collectionId);

  const [search, setSearch] = useState("");
  const candidates = useApps(search === "" ? { size: 10 } : { q: search, size: 10 });

  if (collection.isPending) return <p aria-busy="true">Loading…</p>;
  if (collection.isError) return <p role="alert">{messageFor(collection.error)}</p>;

  const owned = user !== null && user.id === collection.data.user_id;
  const appIds = collection.data.items.map((item) => item.app.id);

  const saveDetails = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({
      name: formString(form, "name"),
      description: formString(form, "description"),
      is_public: form.get("is_public") !== null,
    });
  };

  return (
    <>
      <article>
        <h1>{collection.data.name}</h1>
        {collection.data.description && <p>{collection.data.description}</p>}
        <p>{collection.data.is_public ? "Public" : "Private"}</p>

        <ul>
          {collection.data.items.map(({ app }) => (
            <li key={app.id}>
              <Link to={`/apps/${app.platform}/${app.slug}`}>{app.name}</Link>
              <p>{app.summary}</p>
              {owned && (
                <button
                  type="button"
                  disabled={setApps.isPending}
                  onClick={() => {
                    setApps.mutate(appIds.filter((value) => value !== app.id));
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </article>

      {owned && (
        <>
          <section>
            <h2>Collection details</h2>
            <form onSubmit={saveDetails}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={120}
                defaultValue={collection.data.name}
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={collection.data.description}
              />

              <label htmlFor="is_public">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  defaultChecked={collection.data.is_public}
                />
                Public
              </label>

              {update.isError && <p role="alert">{messageFor(update.error)}</p>}
              {update.isSuccess && <p>Saved.</p>}

              <button type="submit" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save details"}
              </button>
            </form>
          </section>

          <section>
            <h2>Add apps</h2>
            <label htmlFor="app-search">Search the catalog</label>
            <input
              id="app-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
            />

            {setApps.isError && <p role="alert">{messageFor(setApps.error)}</p>}

            <ul>
              {candidates.data?.items
                .filter((app) => !appIds.includes(app.id))
                .map((app) => (
                  <li key={app.id}>
                    <span>{app.name}</span>
                    <span>{app.platform}</span>
                    <button
                      type="button"
                      disabled={setApps.isPending}
                      onClick={() => {
                        setApps.mutate([...appIds, app.id]);
                      }}
                    >
                      Add
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
