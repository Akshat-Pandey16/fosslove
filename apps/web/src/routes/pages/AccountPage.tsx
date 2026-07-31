import { useAuth } from "@/auth/useAuth";
import { useRevokeSession, useSessions } from "@/features/account/hooks";

export function AccountPage() {
  const { user } = useAuth();
  const sessions = useSessions();
  const revoke = useRevokeSession();

  return (
    <section>
      <h1>Account</h1>

      <dl>
        <dt>Email</dt>
        <dd>{user?.email}</dd>
        <dt>Name</dt>
        <dd>{user?.full_name || "—"}</dd>
        <dt>Role</dt>
        <dd>{user?.role}</dd>
        <dt>Verified</dt>
        <dd>{user?.is_verified ? "Yes" : "No"}</dd>
      </dl>

      <h2>Active sessions</h2>
      {sessions.isPending && <p aria-busy="true">Loading sessions…</p>}
      <ul>
        {sessions.data?.map((session) => (
          <li key={session.id}>
            <span>{session.user_agent || "Unknown device"}</span>
            <span>{session.client_ip}</span>
            <time dateTime={session.created_at ?? undefined}>{session.created_at ?? "—"}</time>
            <button
              type="button"
              disabled={revoke.isPending}
              onClick={() => { revoke.mutate(session.id); }}
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
