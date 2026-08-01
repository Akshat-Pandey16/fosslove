import { type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { useConfirmPasswordReset } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const confirm = useConfirmPasswordReset();
  const incomplete = uid === "" || token === "";

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    confirm.mutate({ uid, token, new_password: formString(form, "new_password") });
  };

  if (incomplete) {
    return (
      <section>
        <h1>Choose a new password</h1>
        <p role="alert">
          This reset link is incomplete. <Link to="/forgot-password">Request a new one</Link>.
        </p>
      </section>
    );
  }

  if (confirm.isSuccess) {
    return (
      <section>
        <h1>Password updated</h1>
        <p>{confirm.data.message}</p>
        <Link to="/login">Log in</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Choose a new password</h1>
      <form onSubmit={submit}>
        <label htmlFor="new_password">New password</label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          required
        />

        {confirm.isError && <p role="alert">{messageFor(confirm.error)}</p>}

        <button type="submit" disabled={confirm.isPending}>
          {confirm.isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
