import { type SyntheticEvent } from "react";
import { Link } from "react-router";
import { useRequestPasswordReset } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";

export function ForgotPasswordPage() {
  const request = useRequestPasswordReset();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    request.mutate({ email: formString(form, "email") });
  };

  return (
    <section>
      <h1>Reset your password</h1>

      {request.isSuccess ? (
        <p>{request.data.message}</p>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />

          {request.isError && <p role="alert">{messageFor(request.error)}</p>}

          <button type="submit" disabled={request.isPending}>
            {request.isPending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p>
        <Link to="/login">Back to log in</Link>
      </p>
    </section>
  );
}
