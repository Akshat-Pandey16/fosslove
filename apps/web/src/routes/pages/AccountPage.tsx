import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/useAuth";
import {
  useChangePassword,
  useDataExport,
  useDeleteAccount,
  useRequestEmailChange,
  useRevokeSession,
  useSessions,
  useUpdateProfile,
} from "@/features/account/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";

function ProfileSection() {
  const { user } = useAuth();
  const update = useUpdateProfile();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update.mutate({ full_name: formString(form, "full_name") });
  };

  return (
    <section>
      <h2>Profile</h2>
      <dl>
        <dt>Email</dt>
        <dd>{user?.email}</dd>
        <dt>Role</dt>
        <dd>{user?.role}</dd>
        <dt>Verified</dt>
        <dd>{user?.is_verified ? "Yes" : "No"}</dd>
      </dl>

      <form onSubmit={submit}>
        <label htmlFor="full_name">Display name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          defaultValue={user?.full_name ?? ""}
        />
        {update.isError && <p role="alert">{messageFor(update.error)}</p>}
        {update.isSuccess && <p>Profile updated.</p>}
        <button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save"}
        </button>
      </form>
    </section>
  );
}

function ChangePasswordSection() {
  const change = useChangePassword();
  const navigate = useNavigate();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    change.mutate(
      {
        current_password: formString(form, "current_password"),
        new_password: formString(form, "new_password"),
      },
      {
        onSuccess: (data) => {
          void navigate("/login", { replace: true, state: { notice: data.message } });
        },
      },
    );
  };

  return (
    <section>
      <h2>Change password</h2>
      {change.isSuccess ? (
        <p>{change.data.message}</p>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="current_password">Current password</label>
          <input
            id="current_password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
          />

          <label htmlFor="new_password">New password</label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            required
          />

          {change.isError && <p role="alert">{messageFor(change.error)}</p>}

          <button type="submit" disabled={change.isPending}>
            {change.isPending ? "Changing…" : "Change password"}
          </button>
        </form>
      )}
    </section>
  );
}

function ChangeEmailSection() {
  const request = useRequestEmailChange();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    request.mutate({
      new_email: formString(form, "new_email"),
      current_password: formString(form, "email_current_password"),
    });
  };

  return (
    <section>
      <h2>Change email address</h2>
      {request.isSuccess ? (
        <p>{request.data.message}</p>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="new_email">New email</label>
          <input id="new_email" name="new_email" type="email" required />

          <label htmlFor="email_current_password">Confirm your password</label>
          <input
            id="email_current_password"
            name="email_current_password"
            type="password"
            autoComplete="current-password"
            required
          />

          {request.isError && <p role="alert">{messageFor(request.error)}</p>}

          <button type="submit" disabled={request.isPending}>
            {request.isPending ? "Submitting…" : "Change email"}
          </button>
        </form>
      )}
    </section>
  );
}

function SessionsSection() {
  const sessions = useSessions();
  const revoke = useRevokeSession();

  return (
    <section>
      <h2>Active sessions</h2>
      {sessions.isPending && <p aria-busy="true">Loading sessions…</p>}
      {sessions.isError && <p role="alert">{messageFor(sessions.error)}</p>}
      <ul>
        {sessions.data?.map((session) => (
          <li key={session.id}>
            <span>{session.user_agent || "Unknown device"}</span>
            <span>{session.client_ip}</span>
            <time dateTime={session.created_at ?? undefined}>{session.created_at ?? "—"}</time>
            <button
              type="button"
              disabled={revoke.isPending}
              onClick={() => {
                revoke.mutate(session.id);
              }}
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DataSection() {
  const exportData = useDataExport();

  const download = () => {
    exportData.mutate(undefined, {
      onSuccess: (data) => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "fosslove-data.json";
        anchor.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  return (
    <section>
      <h2>Your data</h2>
      <button type="button" disabled={exportData.isPending} onClick={download}>
        {exportData.isPending ? "Preparing…" : "Download my data"}
      </button>
      {exportData.isError && <p role="alert">{messageFor(exportData.error)}</p>}
    </section>
  );
}

function DangerZoneSection() {
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteAccount();
  const navigate = useNavigate();

  return (
    <section>
      <h2>Delete account</h2>
      <p>This permanently removes your account, collections, favorites and script history.</p>

      {confirming ? (
        <>
          <p role="alert">This cannot be undone. Are you sure?</p>
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(undefined, {
                onSuccess: () => {
                  void navigate("/", { replace: true });
                },
              });
            }}
          >
            {remove.isPending ? "Deleting…" : "Yes, delete my account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            setConfirming(true);
          }}
        >
          Delete my account
        </button>
      )}

      {remove.isError && <p role="alert">{messageFor(remove.error)}</p>}
    </section>
  );
}

export function AccountPage() {
  return (
    <>
      <h1>Account</h1>
      <ProfileSection />
      <ChangePasswordSection />
      <ChangeEmailSection />
      <SessionsSection />
      <DataSection />
      <DangerZoneSection />
    </>
  );
}
