import { useState, type SyntheticEvent } from "react";
import type { Category } from "@/api/types";
import { AdminShell } from "@/components/AdminNav";
import {
  DataTable,
  TableCell,
  TableRow,
  TableSkeleton,
  type DataTableColumn,
} from "@/components/DataTable";
import { QueryBoundary } from "@/components/QueryBoundary";
import { useCategories } from "@/features/catalog/hooks";
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/features/admin/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";
import { hueForCategory, type Hue } from "@/lib/hues";
import {
  Alert,
  Button,
  Card,
  CloseIcon,
  EmptyState,
  Eyebrow,
  Field,
  FolderIcon,
  Input,
  LinuxIcon,
  PageHeader,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  WindowsIcon,
  cx,
} from "@/ui";

const HUE_SWATCH: Record<Hue, string> = {
  ember: "bg-ember",
  honey: "bg-honey",
  moss: "bg-moss",
  pine: "bg-pine",
  sky: "bg-sky",
  cobalt: "bg-cobalt",
  plum: "bg-plum",
  berry: "bg-berry",
};

const COLUMNS: readonly DataTableColumn[] = [
  { key: "category", label: "Category" },
  { key: "slug", label: "Slug" },
  { key: "windows", label: "Windows" },
  { key: "linux", label: "Linux" },
  { key: "actions", label: "Actions", className: "text-right", hideLabel: true },
];

function CategoryFields({ category, idSuffix }: { category?: Category; idSuffix: string }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Name" htmlFor={`name-${idSuffix}`} required>
        <Input
          id={`name-${idSuffix}`}
          name="name"
          required
          maxLength={120}
          defaultValue={category?.name ?? ""}
        />
      </Field>

      <Field label="Icon URL" htmlFor={`icon-${idSuffix}`}>
        <Input
          id={`icon-${idSuffix}`}
          name="icon_url"
          type="url"
          placeholder="https://example.org/icon.svg"
          defaultValue={category?.icon_url ?? ""}
        />
      </Field>

      <Field label="Description" htmlFor={`description-${idSuffix}`} className="sm:col-span-2">
        <Input
          id={`description-${idSuffix}`}
          name="description"
          defaultValue={category?.description ?? ""}
        />
      </Field>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
      {
        onSuccess: () => {
          setEditing(false);
        },
      },
    );
  };

  const hue = hueForCategory(category.slug);
  const editorId = `category-editor-${category.id}`;

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cx("size-8 shrink-0 rounded-md", HUE_SWATCH[hue])}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-ink">{category.name}</span>
              {category.description === "" ? null : (
                <span className="truncate text-xs text-ink-muted">{category.description}</span>
              )}
            </span>
          </div>
        </TableCell>

        <TableCell className="font-mono text-xs text-ink-muted">{category.slug}</TableCell>

        <TableCell>
          <span className="inline-flex items-center gap-2 font-mono text-xs text-ink-muted">
            <WindowsIcon size={13} />
            {category.windows_app_count}
          </span>
        </TableCell>

        <TableCell>
          <span className="inline-flex items-center gap-2 font-mono text-xs text-ink-muted">
            <LinuxIcon size={13} />
            {category.linux_app_count}
          </span>
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {confirming ? (
              <>
                <span className="mr-1 text-xs text-ink-muted">Delete this category?</span>
                <Button
                  variant="danger"
                  size="sm"
                  loading={remove.isPending}
                  onClick={() => {
                    remove.mutate(category.id);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfirming(false);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={editing}
                  {...(editing ? { "aria-controls": editorId } : {})}
                  icon={editing ? <CloseIcon size={15} /> : <PencilIcon size={15} />}
                  onClick={() => {
                    setEditing((current) => !current);
                  }}
                >
                  {editing ? "Close" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<TrashIcon size={15} />}
                  onClick={() => {
                    setConfirming(true);
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {remove.error === null ? null : (
        <TableRow interactive={false}>
          <TableCell colSpan={COLUMNS.length}>
            <Alert tone="danger">{messageFor(remove.error)}</Alert>
          </TableCell>
        </TableRow>
      )}

      {editing && (
        <TableRow interactive={false} className="bg-sunken/50">
          <TableCell colSpan={COLUMNS.length} id={editorId}>
            <form onSubmit={save} className="flex flex-col gap-5 py-2">
              <CategoryFields category={category} idSuffix={String(category.id)} />
              {update.error === null ? null : <Alert tone="danger">{messageFor(update.error)}</Alert>}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" loading={update.isPending}>
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function AdminCategoriesPage() {
  const [creating, setCreating] = useState(false);
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
      {
        onSuccess: () => {
          element.reset();
        },
      },
    );
  };

  return (
    <AdminShell>
      <PageHeader
        eyebrow="admin · catalog"
        title="Categories"
        description="Groups that organise the catalog. Counts are maintained by database triggers."
        actions={
          <Button
            icon={creating ? <CloseIcon size={16} /> : <PlusIcon size={16} />}
            aria-expanded={creating}
            {...(creating ? { "aria-controls": "new-category-panel" } : {})}
            onClick={() => {
              setCreating((current) => !current);
            }}
          >
            {creating ? "Close" : "New category"}
          </Button>
        }
      />

      {creating && (
        <Card id="new-category-panel" className="mb-8 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Eyebrow hue="moss">new category</Eyebrow>
            <h2 className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">
              Add a category
            </h2>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            <CategoryFields idSuffix="new" />
            {create.error === null ? null : <Alert tone="danger">{messageFor(create.error)}</Alert>}
            {create.isSuccess && <Alert tone="success">Category created.</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={create.isPending}>
                Create category
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <QueryBoundary
        isPending={categories.isPending}
        error={categories.error}
        isEmpty={categories.data?.items.length === 0}
        skeleton={<TableSkeleton columns={COLUMNS} rows={6} />}
        empty={
          <EmptyState
            icon={<FolderIcon size={24} />}
            title="No categories yet"
            description="Create the first category to start filling the catalog."
            action={
              <Button
                size="sm"
                icon={<PlusIcon size={16} />}
                onClick={() => {
                  setCreating(true);
                }}
              >
                New category
              </Button>
            }
          />
        }
      >
        <DataTable columns={COLUMNS}>
          {categories.data?.items.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </DataTable>
      </QueryBoundary>
    </AdminShell>
  );
}
