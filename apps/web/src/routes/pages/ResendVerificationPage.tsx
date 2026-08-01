import { type SyntheticEvent } from "react";
import { Link } from "react-router";
import { useResendVerification } from "@/features/auth/hooks";
import { messageFor } from "@/lib/errors";
import { formString } from "@/lib/form";

export function ResendVerificationPage() {
  const resend = useResendVerification();

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    resend.mutate({ email: formString(form, "email") });
  };

  return (
    <section>
      <h1>Resend verification email</h1>

      {resend.isSuccess ? (
        <p>{resend.data.message}</p>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />

          {resend.isError && <p role="alert">{messageFor(resend.error)}</p>}

          <button type="submit" disabled={resend.isPending}>
            {resend.isPending ? "Sending…" : "Resend verification"}
          </button>
        </form>
      )}

      <p>
        <Link to="/login">Back to log in</Link>
      </p>
    </section>
  );
}
