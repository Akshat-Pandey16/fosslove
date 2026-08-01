import { useState, type SyntheticEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { isApiError } from "@/api/errors";
import { formString } from "@/lib/form";
import { useAuth } from "@/auth/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const state = location.state as { from?: string; notice?: string } | null;
  const from = state?.from ?? "/";

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await login(formString(form, "email"), formString(form, "password"));
      await navigate(from, { replace: true });
    } catch (caught) {
      setError(
        isApiError(caught)
          ? (caught.firstFieldError() ?? caught.message)
          : "Something went wrong.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <section>
      <h1>Log in</h1>
      {state?.notice !== undefined && <p role="status">{state.notice}</p>}
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        {error !== null && <p role="alert">{error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p>
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p>
        No account? <Link to="/register">Sign up</Link>
      </p>
    </section>
  );
}
