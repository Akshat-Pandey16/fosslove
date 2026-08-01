import type { ReactNode } from "react";
import { useSearchParams } from "react-router";
import type { ActivityLog } from "@/api/types";
import { AdminShell } from "@/components/AdminNav";
import {
  DataTable,
  TableCell,
  TableRow,
  TableSkeleton,
  type DataTableColumn,
} from "@/components/DataTable";
import { QueryBoundary } from "@/components/QueryBoundary";
import {
  useActivityLog,
  useCleanupTokens,
  useRecomputeCounts,
  type ActivityParams,
} from "@/features/admin/hooks";
import { messageFor } from "@/lib/errors";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { Hue } from "@/lib/hues";
import {
  Alert,
  Badge,
  Button,
  Card,
  ClockIcon,
  EmptyState,
  Eyebrow,
  Field,
  KeyIcon,
  PageHeader,
  Pagination,
  RefreshIcon,
  SearchInput,
  Select,
} from "@/ui";

const STATUS_HUES: Record<ActivityLog["status"], Hue> = {
  ok: "moss",
  failure: "ember",
};

const COLUMNS: readonly DataTableColumn[] = [
  { key: "when", label: "When" },
  { key: "action", label: "Action" },
  { key: "status", label: "Status" },
  { key: "target", label: "Target" },
  { key: "ip", label: "IP" },
];

function MaintenanceCard({
  icon,
  title,
  description,
  label,
  pending,
  onRun,
  message,
  error,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  label: string;
  pending: boolean;
  onRun: () => void;
  message: string | undefined;
  error: unknown;
}) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-sunken text-ink-muted"
        >
          {icon}
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="font-display text-lg leading-tight text-ink">{title}</h3>
          <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Button
          variant="secondary"
          size="sm"
          loading={pending}
          onClick={onRun}
          className="self-start"
        >
          {label}
        </Button>
        {message === undefined ? null : <Alert tone="success">{message}</Alert>}
        {error === null || error === undefined ? null : (
          <Alert tone="danger">{messageFor(error)}</Alert>
        )}
      </div>
    </Card>
  );
}

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");

  const params: ActivityParams = {
    size: 20,
    page,
    ...(searchParams.get("action") !== null ? { action: searchParams.get("action") ?? "" } : {}),
    ...(searchParams.get("status") !== null ? { status: searchParams.get("status") ?? "" } : {}),
  };

  const activity = useActivityLog(params);
  const recompute = useRecomputeCounts();
  const cleanup = useCleanupTokens();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const actionFilter = searchParams.get("action") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const filtered = actionFilter !== "" || statusFilter !== "";

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    next.delete("status");
    next.delete("page");
    setSearchParams(next);
  };

  return (
    <AdminShell>
      <PageHeader
        eyebrow="admin · overview"
        title="Control room"
        description="Run maintenance jobs and read the audit trail of everything that happens in FOSSLove."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <MaintenanceCard
          icon={<RefreshIcon size={20} />}
          title="Recompute category counts"
          description="Rebuilds the denormalized per-platform app counters straight from the catalog tables."
          label="Recompute counts"
          pending={recompute.isPending}
          onRun={() => {
            recompute.mutate();
          }}
          message={recompute.data?.message}
          error={recompute.error}
        />

        <MaintenanceCard
          icon={<KeyIcon size={20} />}
          title="Remove expired refresh tokens"
          description="Purges blacklisted and expired refresh tokens that no session needs any more."
          label="Clean up tokens"
          pending={cleanup.isPending}
          onRun={() => {
            cleanup.mutate();
          }}
          message={cleanup.data?.message}
          error={cleanup.error}
        />
      </div>

      <section className="mt-14 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <Eyebrow hue="cobalt">activity log</Eyebrow>
          <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-ink">
            Everything that happened
          </h2>
        </div>

        <Card>
          <form
            role="search"
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <Field label="Action" htmlFor="activity-action" className="sm:max-w-xs sm:flex-1">
              <SearchInput
                id="activity-action"
                placeholder="app.create"
                value={actionFilter}
                onChange={(event) => {
                  update("action", event.target.value);
                }}
                onClear={() => {
                  update("action", "");
                }}
              />
            </Field>

            <Field label="Status" htmlFor="activity-status" className="sm:w-52">
              <Select
                id="activity-status"
                value={statusFilter}
                onChange={(event) => {
                  update("status", event.target.value);
                }}
              >
                <option value="">Any status</option>
                <option value="ok">ok</option>
                <option value="failure">failure</option>
              </Select>
            </Field>
          </form>
        </Card>

        <QueryBoundary
          isPending={activity.isPending}
          error={activity.error}
          isEmpty={activity.data?.items.length === 0}
          skeleton={<TableSkeleton columns={COLUMNS} rows={8} />}
          empty={
            <EmptyState
              icon={<ClockIcon size={24} />}
              title="No activity recorded"
              description={
                filtered
                  ? "No events match these filters yet."
                  : "Audit events appear here as soon as something happens."
              }
              action={
                filtered ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          }
        >
          <DataTable columns={COLUMNS} scrollable>
            {activity.data?.items.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs text-ink-muted">
                  <time dateTime={entry.created_at} title={formatDateTime(entry.created_at)}>
                    {relativeTime(entry.created_at)}
                  </time>
                </TableCell>
                <TableCell className="font-mono text-xs">{entry.action}</TableCell>
                <TableCell>
                  <Badge size="sm" hue={STATUS_HUES[entry.status]}>
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-ink-muted">
                  {entry.target_type === "" ? "—" : entry.target_type}
                  {entry.target_id === "" ? "" : `:${entry.target_id}`}
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs text-ink-muted">
                  {entry.client_ip === "" ? "—" : entry.client_ip}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </QueryBoundary>

        {activity.data === undefined ? null : (
          <Pagination
            page={activity.data.meta.page}
            pages={activity.data.meta.pages}
            total={activity.data.meta.total}
            unit="events"
            onChange={(next) => {
              update("page", String(next));
            }}
          />
        )}
      </section>
    </AdminShell>
  );
}
