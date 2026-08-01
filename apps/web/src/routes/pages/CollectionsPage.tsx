import { useId, useState, type ReactNode, type SyntheticEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Collection, Paginated } from "@/api/types";
import { CollectionCard } from "@/components/CollectionCard";
import { QueryBoundary } from "@/components/QueryBoundary";
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  usePublicCollections,
} from "@/features/collections/hooks";
import { messageFor } from "@/lib/errors";
import { formatCount } from "@/lib/format";
import { formString } from "@/lib/form";
import {
  Alert,
  Button,
  Card,
  CheckIcon,
  Checkbox,
  CloseIcon,
  EmptyState,
  Eyebrow,
  Field,
  GlobeIcon,
  Input,
  LayersIcon,
  LinkButton,
  PackageIcon,
  PageHeader,
  PlusIcon,
  Section,
  SkeletonList,
  Stagger,
  StaggerItem,
  Textarea,
  TrashIcon,
  cx,
} from "@/ui";

const GRID = "grid gap-5 sm:grid-cols-2 xl:grid-cols-3";

const EASE = [0.22, 1, 0.36, 1] as const;

const ACTION_BUTTON =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface/85 text-ink-faint shadow-soft backdrop-blur transition-all duration-200 ease-out-quint hover:border-berry hover:text-berry disabled:pointer-events-none disabled:opacity-50";

const CONFIRM_BUTTON =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ease-out-quint disabled:pointer-events-none disabled:opacity-50";

interface ListState {
  data: Paginated<Collection> | undefined;
  isPending: boolean;
  error: Error | null;
}

function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const reduced = useReducedMotion() === true;

  if (reduced) return open ? <div>{children}</div> : null;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.34, ease: EASE }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeleteAction({
  name,
  confirming,
  busy,
  onRequest,
  onCancel,
  onConfirm,
}: {
  name: string;
  confirming: boolean;
  busy: boolean;
  onRequest: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={`Delete ${name}`}
        disabled={busy}
        onClick={onRequest}
        className={ACTION_BUTTON}
      >
        <TrashIcon size={16} />
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-line-strong bg-surface/95 p-1 shadow-lift backdrop-blur"
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
    >
      <span className="pl-2 pr-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
        Delete?
      </span>
      <button
        type="button"
        autoFocus
        aria-label={`Confirm deleting ${name}`}
        disabled={busy}
        onClick={onConfirm}
        className={cx(CONFIRM_BUTTON, "border-berry bg-berry text-white hover:bg-berry/90")}
      >
        <CheckIcon size={15} strokeWidth={2.4} />
      </button>
      <button
        type="button"
        aria-label="Keep this collection"
        onClick={onCancel}
        className={cx(
          CONFIRM_BUTTON,
          "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
        )}
      >
        <CloseIcon size={15} />
      </button>
    </div>
  );
}

function ListMeta({ total }: { total: number | undefined }) {
  if (total === undefined) return null;

  return (
    <p className="mb-6 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-faint">
      {formatCount(total)} {total === 1 ? "collection" : "collections"}
    </p>
  );
}

function CollectionGrid({
  state,
  empty,
  renderAction,
}: {
  state: ListState;
  empty: ReactNode;
  renderAction?: ((collection: Collection) => ReactNode) | undefined;
}) {
  const items = state.data?.items ?? [];

  return (
    <QueryBoundary
      isPending={state.isPending}
      error={state.error}
      isEmpty={items.length === 0}
      empty={empty}
      skeleton={
        <div className={GRID}>
          <SkeletonList count={6} />
        </div>
      }
    >
      <Stagger className={GRID}>
        {items.map((collection) => (
          <StaggerItem key={collection.id} className="h-full">
            <CollectionCard
              collection={collection}
              {...(renderAction === undefined ? {} : { action: renderAction(collection) })}
            />
          </StaggerItem>
        ))}
      </Stagger>
    </QueryBoundary>
  );
}

export function MyCollectionsPage() {
  const query = useCollections();
  const create = useCreateCollection();
  const remove = useDeleteCollection();

  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);

  const panelId = useId();
  const nameId = `${panelId}-name`;
  const descriptionId = `${panelId}-description`;

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
      {
        onSuccess: () => {
          element.reset();
        },
      },
    );
  };

  return (
    <Section>
      <PageHeader
        eyebrow="your library"
        title="My collections"
        description="Group the apps you always install into named sets, then turn any set into one script."
        actions={
          <Button
            variant={creating ? "secondary" : "primary"}
            icon={creating ? <CloseIcon size={16} /> : <PlusIcon size={16} />}
            aria-expanded={creating}
            aria-controls={creating ? panelId : undefined}
            onClick={() => {
              setCreating((open) => !open);
            }}
          >
            {creating ? "Cancel" : "New collection"}
          </Button>
        }
      />

      <Collapse open={creating}>
        <div id={panelId} className="pb-10">
          <Card className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Eyebrow>new collection</Eyebrow>
              <h2 className="font-display text-xl leading-tight tracking-[-0.02em] text-ink">
                Name your set
              </h2>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5">
              <Field label="Name" htmlFor={nameId} required className="md:max-w-sm">
                <Input
                  id={nameId}
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  autoFocus
                  autoComplete="off"
                  placeholder="Fresh laptop"
                />
              </Field>

              <Field
                label="Description"
                htmlFor={descriptionId}
                hint="Optional. One line on what this set is for."
              >
                <Textarea
                  id={descriptionId}
                  name="description"
                  rows={3}
                  placeholder="Everything I install on a new work machine."
                />
              </Field>

              <Checkbox
                name="is_public"
                label="Make this collection public"
                description="Anyone can open a public collection and generate its script."
              />

              {create.isError && <Alert tone="danger">{messageFor(create.error)}</Alert>}
              {create.isSuccess && <Alert tone="success">Collection created.</Alert>}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="submit"
                  loading={create.isPending}
                  icon={<PlusIcon size={16} />}
                >
                  Create collection
                </Button>
                <Button
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
        </div>
      </Collapse>

      {remove.isError && (
        <Alert tone="danger" className="mb-6">
          {messageFor(remove.error)}
        </Alert>
      )}

      <ListMeta total={query.data?.meta.total} />

      <CollectionGrid
        state={{ data: query.data, isPending: query.isPending, error: query.error }}
        renderAction={(collection) => (
          <DeleteAction
            name={collection.name}
            confirming={confirming === collection.id}
            busy={remove.isPending}
            onRequest={() => {
              setConfirming(collection.id);
            }}
            onCancel={() => {
              setConfirming(null);
            }}
            onConfirm={() => {
              remove.mutate(collection.id);
              setConfirming(null);
            }}
          />
        )}
        empty={
          <EmptyState
            icon={<LayersIcon size={24} />}
            title="No collections yet"
            description="Collections keep your setups tidy — a work machine, a fresh laptop, a media box."
            action={
              <>
                <Button
                  icon={<PlusIcon size={16} />}
                  onClick={() => {
                    setCreating(true);
                  }}
                >
                  New collection
                </Button>
                <LinkButton to="/collections/public" variant="secondary">
                  See public collections
                </LinkButton>
              </>
            }
          />
        }
      />
    </Section>
  );
}

export function PublicCollectionsPage() {
  const query = usePublicCollections();

  return (
    <Section>
      <PageHeader
        eyebrow="community"
        hue="pine"
        title="Public collections"
        description="Setups other people chose to share. Open one to see what is inside, then build the script."
        actions={
          <LinkButton to="/apps" variant="secondary" icon={<PackageIcon size={16} />}>
            Browse the catalog
          </LinkButton>
        }
      />

      <ListMeta total={query.data?.meta.total} />

      <CollectionGrid
        state={{ data: query.data, isPending: query.isPending, error: query.error }}
        empty={
          <EmptyState
            icon={<GlobeIcon size={24} />}
            title="Nothing shared yet"
            description="No one has published a collection so far. Yours could be the first."
            action={
              <LinkButton to="/collections" variant="secondary">
                Go to my collections
              </LinkButton>
            }
          />
        }
      />
    </Section>
  );
}
