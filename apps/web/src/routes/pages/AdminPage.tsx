import { Link, useSearchParams } from "react-router";
import {
  useActivityLog,
  useCleanupTokens,
  useRecomputeCounts,
  type ActivityParams,
} from "@/features/admin/hooks";
import { messageFor } from "@/lib/errors";

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

  return (
    <>
      <h1>Admin</h1>

      <nav aria-label="Admin sections">
        <Link to="/admin/apps">Apps</Link>
        <Link to="/admin/categories">Categories</Link>
        <Link to="/admin/settings">Settings</Link>
      </nav>

      <section>
        <h2>Maintenance</h2>
        <button
          type="button"
          disabled={recompute.isPending}
          onClick={() => { recompute.mutate(); }}
        >
          Recompute category counts
        </button>
        {recompute.data && <p>{recompute.data.message}</p>}
        {recompute.isError && <p role="alert">{messageFor(recompute.error)}</p>}

        <button type="button" disabled={cleanup.isPending} onClick={() => { cleanup.mutate(); }}>
          Remove expired refresh tokens
        </button>
        {cleanup.data && <p>{cleanup.data.message}</p>}
        {cleanup.isError && <p role="alert">{messageFor(cleanup.error)}</p>}
      </section>

      <section>
        <h2>Activity log</h2>

        <form role="search" onSubmit={(event) => { event.preventDefault(); }}>
          <label htmlFor="activity-action">Action</label>
          <input
            id="activity-action"
            type="search"
            defaultValue={searchParams.get("action") ?? ""}
            onChange={(event) => { update("action", event.target.value); }}
          />

          <label htmlFor="activity-status">Status</label>
          <select
            id="activity-status"
            value={searchParams.get("status") ?? ""}
            onChange={(event) => { update("status", event.target.value); }}
          >
            <option value="">Any status</option>
            <option value="success">success</option>
            <option value="failure">failure</option>
          </select>
        </form>

        {activity.isPending && <p aria-busy="true">Loading activity…</p>}
        {activity.isError && <p role="alert">{messageFor(activity.error)}</p>}

        <table>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Action</th>
              <th scope="col">Status</th>
              <th scope="col">Target</th>
              <th scope="col">IP</th>
            </tr>
          </thead>
          <tbody>
            {activity.data?.items.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <time dateTime={entry.created_at}>{entry.created_at}</time>
                </td>
                <td>{entry.action}</td>
                <td>{entry.status}</td>
                <td>
                  {entry.target_type}
                  {entry.target_id && `:${entry.target_id}`}
                </td>
                <td>{entry.client_ip}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {activity.data && activity.data.meta.pages > 1 && (
          <nav aria-label="Pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => { update("page", String(page - 1)); }}
            >
              Previous
            </button>
            <span>
              Page {activity.data.meta.page} of {activity.data.meta.pages}
            </span>
            <button
              type="button"
              disabled={page >= activity.data.meta.pages}
              onClick={() => { update("page", String(page + 1)); }}
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </>
  );
}
