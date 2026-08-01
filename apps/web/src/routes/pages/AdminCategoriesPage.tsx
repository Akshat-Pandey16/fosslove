import { useState, type SyntheticEvent } from "react";
import type { Category } from "@/api/types";
import { useCategories } from "@/features/catalog/hooks";
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/admin/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateCategory();
  const remove = useDeleteCategory();

  const save = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate(
      {
        id: category.id,
        input: {
          name: formString(form, "name"),
          description: formString(form, "description"),
          icon_url: formString(form, "icon_url"),
        },
      },
      { onSuccess: () => { setEditing(false); } },
    );
  };

  if (editing) {
    return (
      <li>
        <form onSubmit={save}>
          <label htmlFor={`name-${category.id}`}>Name</label>
          <input id={`name-${category.id}`} name="name" defaultValue={category.name} required />

          <label htmlFor={`description-${category.id}`}>Description</label>
          <input
            id={`description-${category.id}`}
            name="description"
            defaultValue={category.description}
          />

          <label htmlFor={`icon-${category.id}`}>Icon URL</label>
          <input
            id={`icon-${category.id}`}
            name="icon_url"
            type="url"
            defaultValue={category.icon_url}
          />

          {update.isError && <p role="alert">{messageFor(update.error)}</p>}

          <button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => { setEditing(false); }}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <strong>{category.name}</strong>
      <span>{category.slug}</span>
      <span>
        {category.windows_app_count} Windows / {category.linux_app_count} Linux
      </span>
      {category.description && <p>{category.description}</p>}
      <button type="button" onClick={() => { setEditing(true); }}>
        Edit
      </button>
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => { remove.mutate(category.id); }}
      >
        Delete
      </button>
      {remove.isError && <p role="alert">{messageFor(remove.error)}</p>}
    </li>
  );
}

export function AdminCategoriesPage() {
  const categories = useCategories({ size: 100 });
  const create = useCreateCategory();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    create.mutate(
      {
        name: formString(form, "name"),
        description: formString(form, "description"),
        icon_url: formString(form, "icon_url"),
      },
      { onSuccess: () => { element.reset(); } },
    );
  };

  return (
    <>
      <h1>Categories</h1>

      {categories.isPending && <p aria-busy="true">Loading…</p>}
      {categories.isError && <p role="alert">{messageFor(categories.error)}</p>}

      <ul>
        {categories.data?.items.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </ul>

      <section>
        <h2>New category</h2>
        <form onSubmit={submit}>
          <label htmlFor="new-name">Name</label>
          <input id="new-name" name="name" required maxLength={120} />

          <label htmlFor="new-description">Description</label>
          <input id="new-description" name="description" />

          <label htmlFor="new-icon">Icon URL</label>
          <input id="new-icon" name="icon_url" type="url" />

          {create.isError && <p role="alert">{messageFor(create.error)}</p>}

          <button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create category"}
          </button>
        </form>
      </section>
    </>
  );
}
