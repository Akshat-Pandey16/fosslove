import {
  useActivityLog,
  useCleanupTokens,
  useRecomputeCounts,
  useSiteConfiguration,
} from "@/features/admin/hooks";

export function AdminPage() {
  const settings = useSiteConfiguration();
  const activity = useActivityLog({ size: 20 });
  const recompute = useRecomputeCounts();
  const cleanup = useCleanupTokens();

  return (
    <section>
      <h1>Admin</h1>

      <h2>Runtime settings</h2>
      {settings.isPending && <p aria-busy="true">Loading settings…</p>}
      {settings.data && (
        <dl>
          {Object.entries(settings.data).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <h2>Maintenance</h2>
      <button type="button" disabled={recompute.isPending} onClick={() => { recompute.mutate(); }}>
        Recompute category counts
      </button>
      {recompute.data && <p>{recompute.data.message}</p>}

      <button type="button" disabled={cleanup.isPending} onClick={() => { cleanup.mutate(); }}>
        Remove expired refresh tokens
      </button>
      {cleanup.data && <p>{cleanup.data.message}</p>}

      <h2>Recent activity</h2>
      {activity.isPending && <p aria-busy="true">Loading activity…</p>}
      <table>
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Action</th>
            <th scope="col">Status</th>
            <th scope="col">Target</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
