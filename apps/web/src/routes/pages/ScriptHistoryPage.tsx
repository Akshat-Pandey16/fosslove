import { useScriptHistory } from "@/features/scripts/hooks";

export function ScriptHistoryPage() {
  const history = useScriptHistory();

  return (
    <section>
      <h1>Script history</h1>
      {history.isPending && <p aria-busy="true">Loading…</p>}
      {history.isError && <p role="alert">{history.error.message}</p>}
      {history.data?.items.length === 0 && <p>No scripts generated yet.</p>}
      <ol>
        {history.data?.items.map((run) => (
          <li key={run.id}>
            <span>{run.platform}</span>
            <span>{run.app_count} apps</span>
            <time dateTime={run.created_at}>{run.created_at}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
